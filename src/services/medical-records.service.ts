import { HttpException } from '@/exceptions/HttpException';
import { CreateDoctorRecordJsonDto, CreateMedicalRecordDto } from '@/dtos/medical-records.dto';
import { MedicalRecord, MedicalRecordFile } from '@/interfaces/medicalRecords.interface';
import prisma from '@/config/prisma';
import { Prisma } from '@prisma/client';
import { Service } from 'typedi';
import { IpfsService } from '@/services/ipfs.service';
import { EncryptionService } from '@/services/encryption.service';
import { KeyManagementService } from '@/services/key-management.service';
import { createBilingualError, ErrorMessages } from '@/utils/errorMessages';
import { randomUUID } from 'crypto';
import FabricService from '@/services/fabric.service';


@Service()
export class MedicalRecordService {

    private ipfsService = new IpfsService();
    private encryptionService = new EncryptionService();
    private keyManagementService = new KeyManagementService();
    private fabricService = new FabricService();

    public async createMedicalRecord(
        clinicId: string,
        patientId: string,
        doctorId: string,
        fileData: CreateMedicalRecordDto,
        fileBuffer: Buffer,
        fileName: string,
        mimeType: string,
    ): Promise<void> {
        const recordId = randomUUID();

        const recordDEK = await this.keyManagementService.getRecordDEK(clinicId, patientId, recordId);
        const encryptedFile = this.encryptionService.encryptFile(fileBuffer, recordDEK);
        recordDEK.fill(0);

        const cid = await this.ipfsService.uploadFile(encryptedFile, fileName, mimeType);

        await prisma.medicalRecord.create({
            data: {
                id: recordId,
                patient_id: patientId,
                doctor_id: doctorId,
                clinic_id: clinicId,
                appointment_id: (fileData as any).appointmentId,
                name: fileData.name,
                cid: cid,
                type: fileData.type,
                mime_type: mimeType,
            } as Prisma.MedicalRecordUncheckedCreateInput,
        });

        // Sync to blockchain ledger
        await this.fabricService.addRecord(clinicId, {
            patientId,
            recordId,
            doctorId,
            type: fileData.type,
            ipfsCidKey: cid,
        });
    }
    public async getRecordFile(callerClinicId: string, recordId: string): Promise<MedicalRecordFile> {
        const record = await prisma.medicalRecord.findFirst({
            where: {
                id: recordId,
                deleted_at: null
            },
            select: {
                id: true,
                patient_id: true,
                clinic_id: true,
                doctor_id: true,
                appointment_id: true,
                name: true,
                type: true,
                mime_type: true,
                cid: true,
            }
        });

        if (!record) {
            const error = createBilingualError(404, ErrorMessages.RECORD_NOT_FOUND);
            throw new HttpException(error.status, error.message, error.messageAr);
        }

        // Verify the caller's clinic is authorized on-chain.
        // GetRecordsByPatient enforces MSP authorization — if the caller is not the owner
        // or not in authorizedMsps, the record won't appear in the result.
        const authorizedRecords = await this.fabricService.getRecordsByPatient(callerClinicId, record.patient_id);
        const isAuthorized = authorizedRecords.some(r => r.recordId === recordId);
        if (!isAuthorized) {
            throw new HttpException(403, 'Access denied: your clinic is not authorized to access this record');
        }

        const encryptedFile = await this.ipfsService.getFile(record.cid);

        // Decrypt using the owner clinic's key (the clinic that created the record)
        const recordDEK = await this.keyManagementService.getRecordDEK(record.clinic_id, record.patient_id, record.id);
        const decryptedFile = this.encryptionService.decryptFile(encryptedFile, recordDEK);
        recordDEK.fill(0);

        return {
            id: record.id,
            patient_id: record.patient_id,
            clinic_id: record.clinic_id,
            doctor_id: record.doctor_id ?? undefined,
            appointment_id: record.appointment_id ?? undefined,
            name: record.name,
            type: record.type,
            mime_type: record.mime_type,
            cid: record.cid,
            buffer: decryptedFile,
        };
    }

    public async checkIpfsHealth(): Promise<{ status: string; message: string }> {
        return this.ipfsService.checkHealth();
    }
    public async getPatientFiles(patientId: string): Promise<MedicalRecord[]> {
        const records = await prisma.medicalRecord.findMany({
            where: {
                patient_id: patientId,
                deleted_at: null
            },
            select: {
                id: true,
                patient_id: true,
                clinic_id: true,
                doctor_id: true,
                appointment_id: true,
                name: true,
                type: true,
                mime_type: true,
                cid: true,
            },
            orderBy: { 
                created_at: 'desc' 
            },
        });



        return records.map(record => ({
            id: record.id,
            patient_id: record.patient_id,
            clinic_id: record.clinic_id,
            doctor_id: record.doctor_id ?? undefined,
            appointment_id: record.appointment_id ?? undefined,
            name: record.name,
            type: record.type,
            cid: record.cid,
            mime_type: record.mime_type,
        }));
    }

    public async deleteRecord(callerClinicId: string, recordId: string): Promise<void> {
        const record = await prisma.medicalRecord.findFirst({
            where: {
                id: recordId,
                deleted_at: null
            },
        });

        if (!record) {
            const error = createBilingualError(404, ErrorMessages.RECORD_NOT_FOUND);
            throw new HttpException(error.status, error.message, error.messageAr);
        }

        if (record.deleted_at) {
            const error = createBilingualError(404, ErrorMessages.RECORD_ALREADY_DELETED);
            throw new HttpException(error.status, error.message, error.messageAr);
        }

        // Chaincode enforces ownerMSP check — non-owners get a chaincode error
        await this.fabricService.deleteRecord(callerClinicId, record.patient_id, recordId);

        // Soft-delete in DB
        await prisma.medicalRecord.update({
            where: { id: recordId },
            data: { deleted_at: new Date() },
        });
    }


    public async grantAccess(patientId: string, targetClinicId: string): Promise<void> {
        // Fetch all records for this patient to find distinct owner clinics
        const records = await prisma.medicalRecord.findMany({
            where: { patient_id: patientId, deleted_at: null },
            select: { clinic_id: true },
        });

        // Group by owner clinic — each clinic MSP must grant independently
        const ownerClinicIds = [...new Set(records.map(r => r.clinic_id))];

        for (const ownerClinicId of ownerClinicIds) {
            await this.fabricService.grantAccess(ownerClinicId, patientId, targetClinicId);
        }
    }

    /**
     * Doctor-initiated record creation (JSON-based).
     * Validates the doctor works in the clinic, serialises the JSON content to a Buffer,
     * encrypts it, uploads to IPFS, stores in DB, syncs to blockchain, and returns the record ID.
     */
    public async addDoctorRecord(
        clinicId: string,
        patientId: string,
        doctorId: string,
        dto: CreateDoctorRecordJsonDto,
    ): Promise<string> {
        // Validate the doctor is associated with this clinic
        const clinicDoctor = await prisma.clinicDoctor.findUnique({
            where: { clinic_id_doctor_id: { clinic_id: clinicId, doctor_id: doctorId } },
        });
        if (!clinicDoctor) {
            throw new HttpException(403, 'Doctor is not associated with this clinic');
        }

        const recordId = randomUUID();

        // Serialise JSON content to a UTF-8 Buffer and encrypt it
        const contentBuffer = Buffer.from(JSON.stringify(dto.content), 'utf-8');
        const recordDEK = await this.keyManagementService.getRecordDEK(clinicId, patientId, recordId);
        const encryptedFile = this.encryptionService.encryptFile(contentBuffer, recordDEK);
        recordDEK.fill(0);

        // Upload as octet-stream — the file is encrypted binary regardless of original content type.
        // Uploading as application/json causes Pinata's gateway to call .json() on the encrypted
        // bytes when fetching, which throws a parse error.
        const cid = await this.ipfsService.uploadFile(encryptedFile, `${recordId}.enc`, 'application/octet-stream');

        await prisma.medicalRecord.create({
            data: {
                id: recordId,
                patient_id: patientId,
                doctor_id: doctorId,
                clinic_id: clinicId,
                name: dto.name,
                cid: cid,
                type: dto.type,
                mime_type: 'application/json', // logical type of the decrypted content
            } as Prisma.MedicalRecordUncheckedCreateInput,
        });

        // Sync to blockchain ledger
        await this.fabricService.addRecord(clinicId, {
            patientId,
            recordId,
            doctorId,
            type: dto.type,
            ipfsCidKey: cid,
        });

        return recordId;
    }

    /**
     * Retrieves all SOAP_NOTE records for a patient, decrypts the JSON files,
     * and returns their parsed contents as a list of objects.
     */
    /**
     * Doctor-facing: returns DB metadata for all of a patient's records
     * that the caller's clinic is authorized to access on-chain.
     */
    public async getPatientRecordsForDoctor(callerClinicId: string, patientId: string): Promise<MedicalRecord[]> {
        // Get on-chain authorized record IDs for this clinic
        const authorizedOnChain = await this.fabricService.getRecordsByPatient(callerClinicId, patientId);
        const authorizedIds = new Set(authorizedOnChain.map(r => r.recordId));

        const records = await prisma.medicalRecord.findMany({
            where: { patient_id: patientId, deleted_at: null },
            select: {
                id: true,
                patient_id: true,
                clinic_id: true,
                doctor_id: true,
                appointment_id: true,
                name: true,
                type: true,
                mime_type: true,
                cid: true,
            },
            orderBy: { created_at: 'desc' },
        });

        return records
            .filter(r => authorizedIds.has(r.id))
            .map(record => ({
                id: record.id,
                patient_id: record.patient_id,
                clinic_id: record.clinic_id,
                doctor_id: record.doctor_id ?? undefined,
                appointment_id: record.appointment_id ?? undefined,
                name: record.name,
                type: record.type,
                cid: record.cid,
                mime_type: record.mime_type,
            }));
    }

    public async getSOAPNotes(callerClinicId: string, patientId: string): Promise<Array<{ recordId: string; content: any }>> {
        const records = await prisma.medicalRecord.findMany({
            where: {
                patient_id: patientId,
                mime_type: 'application/json',
                deleted_at: null,
            },
            select: {
                id: true,
                patient_id: true,
                clinic_id: true,
                cid: true,
            },
            orderBy: { created_at: 'desc' },
        });

        // Verify on-chain access once for this patient
        const authorizedRecords = await this.fabricService.getRecordsByPatient(callerClinicId, patientId);
        const authorizedIds = new Set(authorizedRecords.map(r => r.recordId));

        const results: Array<{ recordId: string; content: any }> = [];

        for (const record of records) {
            if (!authorizedIds.has(record.id)) continue;

            try {
                const encryptedFile = await this.ipfsService.getFile(record.cid);
                const recordDEK = await this.keyManagementService.getRecordDEK(record.clinic_id, record.patient_id, record.id);
                const decryptedFile = this.encryptionService.decryptFile(encryptedFile, recordDEK);
                recordDEK.fill(0);

                const content = JSON.parse(decryptedFile.toString('utf-8'));
                results.push({ recordId: record.id, content });
            } catch (e) {
                // Skip records that are binary files (not JSON-based)
                console.warn(`⚠️  Skipping record ${record.id}: not a JSON record (${e.message})`);
            }
        }

        return results;
    }
    public async getSOAPNotesForPatient(patientId: string): Promise<Array<{ recordId: string; content: any }>> {
        const records = await prisma.medicalRecord.findMany({
            where: {
                patient_id: patientId,
                mime_type: 'application/json',
                deleted_at: null,
            },
            select: {
                id: true,
                patient_id: true,
                clinic_id: true,
                cid: true,
            },
            orderBy: { created_at: 'desc' },
        });
        
        // Get all distinct clinics from the records
        const distinctClinicIds = [...new Set(records.map(r => r.clinic_id))];

        // Call getRecordsByPatient for each clinic sequentially to avoid concurrent gRPC channel conflicts
        const authorizedIds = new Set<string>();
        for (const clinicId of distinctClinicIds) {
            const authorizedRecords = await this.fabricService.getRecordsByPatient(clinicId, patientId);
            authorizedRecords.forEach(r => authorizedIds.add(r.recordId));
        }

        const results: Array<{ recordId: string; content: any }> = [];

        for (const record of records) {
            if (!authorizedIds.has(record.id)) continue;

            try {
                const encryptedFile = await this.ipfsService.getFile(record.cid);
                const recordDEK = await this.keyManagementService.getRecordDEK(record.clinic_id, record.patient_id, record.id);
                const decryptedFile = this.encryptionService.decryptFile(encryptedFile, recordDEK);
                recordDEK.fill(0);

                const content = JSON.parse(decryptedFile.toString('utf-8'));
                results.push({ recordId: record.id, content });
            } catch (e) {
                // Skip records that are binary files (not JSON-based)
                console.warn(`⚠️  Skipping record ${record.id}: not a JSON record (${e.message})`);
            }
        }

        return results;
    }

    /**
     * DEV ONLY — hard-deletes every medical record from DB, IPFS, and the blockchain.
     */
    public async deleteAllRecords(): Promise<{ deleted: number }> {
        const records = await prisma.medicalRecord.findMany({
            select: { id: true, patient_id: true, clinic_id: true, cid: true },
        });

        for (const record of records) {
            // 1. Remove from blockchain
            try {
                await this.fabricService.deleteRecord(record.clinic_id, record.patient_id, record.id);
            } catch (e) {
                console.warn(`⚠️  Chain delete skipped for ${record.id}: ${e.message}`);
            }

            // 2. Remove from IPFS
            try {
                await this.ipfsService.deleteFile(record.cid);
            } catch (e) {
                console.warn(`⚠️  IPFS delete skipped for ${record.id}: ${e.message}`);
            }

            // 3. Hard-delete from DB
            await prisma.medicalRecord.delete({ where: { id: record.id } });
        }

        return { deleted: records.length };
    }
}