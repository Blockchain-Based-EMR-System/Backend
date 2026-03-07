import { HttpException } from '@/exceptions/HttpException';
import { CreateMedicalRecordDto } from '@/dtos/medical-records.dto';
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

    public async getRecordFile(recordId: string): Promise<MedicalRecordFile> {
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

        const encryptedFile = await this.ipfsService.getFile(record.cid);

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

    // delete any MR (soft)
    public async deleteRecord(recordId: string): Promise<void> {
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

        // Remove from blockchain ledger
        await this.fabricService.deleteRecord(record.clinic_id, record.patient_id, recordId);

        // Soft-delete in DB
        await prisma.medicalRecord.update({
            where: { id: recordId },
            data: { deleted_at: new Date() },
        });
    }
}