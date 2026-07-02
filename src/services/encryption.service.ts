import { Service } from 'typedi';
import * as crypto from 'crypto';
import { HttpException } from '@/exceptions/HttpException';
import { createBilingualError, ErrorMessages } from '@/utils/errorMessages';


@Service()
export class EncryptionService {
    private readonly algorithm = 'aes-256-gcm';
    private readonly ivLength = 12;
    private readonly tagLength = 16;
    private readonly keyLength = 32;


    public encryptFile(fileBuffer: Buffer, dek: Buffer): Buffer {
        const iv = crypto.randomBytes(this.ivLength);
        const cipher = crypto.createCipheriv(this.algorithm, dek, iv);

        const encryptedData = Buffer.concat([cipher.update(fileBuffer), cipher.final()]);
        const tag = cipher.getAuthTag();

        return Buffer.concat([iv, tag, encryptedData])
    }

    public decryptFile(encryptedFile: Buffer, dek: Buffer): Buffer {
        const iv = encryptedFile.subarray(0, this.ivLength);
        const tag = encryptedFile.subarray(this.ivLength, this.ivLength + this.tagLength);
        const encryptedData = encryptedFile.subarray(this.ivLength + this.tagLength);

        const decipher = crypto.createDecipheriv(this.algorithm, dek, iv);
        decipher.setAuthTag(tag);

        return Buffer.concat([decipher.update(encryptedData), decipher.final()]);

    }

    public encryptDEK(dek: Buffer): string {
        const masterKey = this.getMasterKey();
        const iv = crypto.randomBytes(this.ivLength);

        const cipher = crypto.createCipheriv(this.algorithm, masterKey, iv);

        const encryptedData = Buffer.concat([cipher.update(dek), cipher.final()]);
        const tag = cipher.getAuthTag();
        return Buffer.concat([iv, tag, encryptedData]).toString('hex');

    }

    public decryptDEK(encryptedDEK: string): Buffer {
        const masterKey = this.getMasterKey();
        const data = Buffer.from(encryptedDEK, 'hex');

        const iv = data.subarray(0, this.ivLength);
        const tag = data.subarray(this.ivLength, this.ivLength + this.tagLength);
        const encryptedData = data.subarray(this.ivLength + this.tagLength);

        const decipher = crypto.createDecipheriv(this.algorithm, masterKey, iv);
        decipher.setAuthTag(tag);

        return Buffer.concat([decipher.update(encryptedData), decipher.final()]);

    }


    public generateDEK(): Buffer {
        return crypto.randomBytes(this.keyLength);
    }

    private getMasterKey(): Buffer {
        const masterKey = process.env.MASTER_ENCRYPTION_KEY;
        console.log('Master Key:', masterKey);
        if (!masterKey) {
            const error = createBilingualError(500, ErrorMessages.MASTER_KEY_NOT_SET);
            throw new HttpException(error.status, error.message, error.messageAr);
        }
        const keyBuffer = Buffer.from(masterKey, 'hex');
        if (keyBuffer.length !== this.keyLength) {
            const error = createBilingualError(500, ErrorMessages.INVALID_MASTER_KEY_LENGTH);
            throw new HttpException(error.status, error.message, error.messageAr);
        }
        return Buffer.from(masterKey, 'hex');
    }
}