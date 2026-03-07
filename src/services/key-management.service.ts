import { Service } from 'typedi';
import { EncryptionService } from './encryption.service';
import { HttpException } from '@/exceptions/HttpException';
import FabricService from '@/services/fabric.service';

@Service()
export class KeyManagementService {

    private encryptionService = new EncryptionService();
    private fabricService = new FabricService();

    /**
     * Generates a fresh DEK, wraps it with the master key, and stores the
     * encrypted form in the record's implicit private data collection on the
     * blockchain. Throws if a key already exists for this record.
     */
    public async createRecordKey(clinicId: string, patientId: string, recordId: string): Promise<void> {
        const exists = await this.fabricService.recordKeyExists(clinicId, patientId, recordId);
        if (exists) {
            throw new HttpException(400, `Encryption key already exists for record: ${recordId}`);
        }

        const recordDEK = this.encryptionService.generateDEK();
        const encryptedDEK = this.encryptionService.encryptDEK(recordDEK);
        recordDEK.fill(0);

        await this.fabricService.storeRecordKey(clinicId, patientId, recordId, encryptedDEK);
    }

    /**
     * Fetches the encrypted DEK for a specific record from the blockchain and
     * decrypts it with the master key. Creates a new key automatically if one
     * does not yet exist.
     */
    public async getRecordDEK(clinicId: string, patientId: string, recordId: string): Promise<Buffer> {
        const exists = await this.fabricService.recordKeyExists(clinicId, patientId, recordId);
        if (!exists) {
            await this.createRecordKey(clinicId, patientId, recordId);
        }

        const encryptedDEK = await this.fabricService.getRecordKey(clinicId, patientId, recordId);
        return this.encryptionService.decryptDEK(encryptedDEK);
    }
}

