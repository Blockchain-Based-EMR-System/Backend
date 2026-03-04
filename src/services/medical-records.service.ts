import { HttpException } from '@/exceptions/HttpException';
import { CreateMedicalRecordDto } from '@/dtos/medical-records.dto';
import { MedicalRecord, MedicalRecordFile } from '@/interfaces/medicalRecords.interface';
import prisma from '@/config/prisma';
import { Service } from 'typedi';
import { IpfsService } from '@/services/ipfs.service';
import { EncryptionService } from '@/services/encryption.service';
import { KeyManagementService } from '@/services/key-management.service';
import { createBilingualError, ErrorMessages } from '@/utils/errorMessages';


@Service()
export class MedicalRecordService {

    private ipfsService = new IpfsService();
    private encryptionService = new EncryptionService();
    private keyManagementService = new KeyManagementService();

    public async createMedicalRecord(
        patientId: string,
        doctorId: string,
        fileData: CreateMedicalRecordDto,
        fileBuffer: Buffer,
        fileName: string,
        mimeType: string,
    ): Promise<void> {
        const patientDEK = await this.keyManagementService.getPatientDEK(patientId);
        const encryptedFile = this.encryptionService.encryptFile(fileBuffer, patientDEK);
        patientDEK.fill(0);

        const cid = await this.ipfsService.uploadFile(encryptedFile, fileName, mimeType);

        const keyRecord = await prisma.encryptionKey.findUnique({
            where: {
                patient_id: patientId
            },
            select: {
                id: true
            },
        });

        await prisma.medicalRecord.create({
            data: {
                patient_id: patientId,
                doctor_id: doctorId,
                clinic_id: (fileData as any).clinicId,
                appointment_id: (fileData as any).appointmentId,
                name: fileData.name,
                cid: cid,
                type: fileData.type,
                mime_type: mimeType,
                key_id: keyRecord.id,
            },
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

        const patientDEK = await this.keyManagementService.getPatientDEK(record.patient_id);
        const decryptedFile = this.encryptionService.decryptFile(encryptedFile, patientDEK);
        patientDEK.fill(0);

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

        await prisma.medicalRecord.update({
            where: {
                id: recordId
            },
            data: {
                deleted_at: new Date()
            },
        });
    }
}