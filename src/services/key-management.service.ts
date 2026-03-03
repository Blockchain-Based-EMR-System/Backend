import { Service } from 'typedi';
import prisma from '@/config/prisma';
import { EncryptionService } from './encryption.service';
import { HttpException } from '@/exceptions/HttpException';
import { createBilingualError, ErrorMessages } from '@/utils/errorMessages';

@Service()
export class KeyManagementService {

    private encryptionService = new EncryptionService();

    public async createPatientKey(patientId: string): Promise<void> {
        const existing = await prisma.encryptionKey.findUnique({
            where: {
                patient_id: patientId
            }
        });
        if (existing){
            const error = createBilingualError(400, ErrorMessages.PATIENT_KEY_ALREADY_EXISTS);
            throw new HttpException(error.status, error.message, error.messageAr);
        }

        const patientDEK = this.encryptionService.generateDEK();
        const encryptedDEK = this.encryptionService.encryptDEK(patientDEK);

        await prisma.encryptionKey.create({
            data: {
                patient_id: patientId,
                encrypted_key: encryptedDEK,
                algorithm: 'AES-256-GCM',
            }
        });
        patientDEK.fill(0);
    }

    public async getPatientDEK(patientId: string): Promise<Buffer> {
        const keyRecord = await prisma.encryptionKey.findUnique({
            where: {
                patient_id: patientId
            }
        });

        if (!keyRecord) {
            await this.createPatientKey(patientId);
            // const error = createBilingualError(404, ErrorMessages.PATIENT_KEY_NOT_FOUND);
            // throw new HttpException(error.status, error.message, error.messageAr);
        }
        return this.encryptionService.decryptDEK(keyRecord.encrypted_key);
    }

}
