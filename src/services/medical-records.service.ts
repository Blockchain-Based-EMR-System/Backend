import { HttpException } from '@/exceptions/HttpException';
import { CreateMedicalRecordDto } from '@/dtos/medical-records.dto';
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


    // create a new  MR
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

        // save to db
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

    public async getRecordFile(recordId: string): Promise<{ buffer: Buffer; mimeType: string; name: string }> {
        const record = await prisma.medicalRecord.findFirst({
            where: {
                id: recordId,
                deleted_at: null
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
            buffer: decryptedFile,
            mimeType: record.mime_type,
            name: record.name,
        };
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