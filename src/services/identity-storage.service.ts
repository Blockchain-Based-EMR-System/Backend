import { promises as fs } from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { FabricIdentity, FabricIdentityInput } from '@/interfaces/fabric-identity.interface';
import { HttpException } from '@/exceptions/HttpException';

export class IdentityStorageService {
    private readonly storagePath: string;
    private readonly encryptionKey: Buffer;
    private readonly defaultClinicId = 'default-clinic';

    constructor() {
        this.storagePath = process.env.FABRIC_IDENTITY_STORAGE_PATH || 
            path.resolve(__dirname, '../../data/fabric-identities.json');

        // for private key encryption
        const keyEnv = process.env.FABRIC_IDENTITY_ENCRYPTION_KEY;
        if (keyEnv) {
            this.encryptionKey = Buffer.from(keyEnv, 'hex');
        } else {
            this.encryptionKey = crypto.scryptSync('development-only-key', 'salt', 32);
        }
    }

    private async readAll(): Promise<FabricIdentity[]> {
        try {
            const dir = path.dirname(this.storagePath);
            await fs.mkdir(dir, { recursive: true });
            const data = await fs.readFile(this.storagePath, 'utf-8');
            const stored = JSON.parse(data) as FabricIdentity[];
            return stored.map(identity => ({
                ...identity,
                privateKey: this.decrypt(identity.privateKey),
            }));
        } catch (error: any) {
            if (error.code === 'ENOENT') {
                return [];
            }
            throw error;
        }
    }


    public async storeIdentity(input: FabricIdentityInput): Promise<FabricIdentity> {
        const identities = await this.readAll();
        const now = new Date().toISOString();
        const existing = identities.find(id => id.clinicId === input.clinicId);

        const identity: FabricIdentity = {
            clinicId: input.clinicId,
            mspId: input.mspId,
            certificate: input.certificate,
            privateKey: input.privateKey,
            peerEndpoint: input.peerEndpoint,
            peerHostAlias: input.peerHostAlias,
            tlsCertificate: input.tlsCertificate,
            channelName: input.channelName || 'mychannel',
            chaincodeName: input.chaincodeName || 'test',
            createdAt: existing?.createdAt || now,
            updatedAt: now,
        };

        this.validateIdentity(identity);

        const updated = identities.filter(id => id.clinicId !== identity.clinicId);
        updated.push(identity);
        await this.persistToStorage(updated);

        console.log(`✅ Stored identity for clinic: ${identity.clinicId} (MSP: ${identity.mspId})`);

        return this.sanitizeIdentity(identity);
    }

    
    public async getIdentity(clinicId: string): Promise<FabricIdentity> {
        const identities = await this.readAll();
        const identity = identities.find(id => id.clinicId === clinicId);

        if (!identity) {
            throw new HttpException(404, `Identity not found for clinic: ${clinicId}`);
        }

        return identity;
    }

    public async listIdentities(): Promise<Array<Omit<FabricIdentity, 'privateKey' | 'certificate' | 'tlsCertificate'>>> {
        const identities = await this.readAll();

        return identities.map(identity => ({
            clinicId: identity.clinicId,
            mspId: identity.mspId,
            peerEndpoint: identity.peerEndpoint,
            peerHostAlias: identity.peerHostAlias,
            channelName: identity.channelName,
            chaincodeName: identity.chaincodeName,
            createdAt: identity.createdAt,
            updatedAt: identity.updatedAt,
        }));
    }
    public async defaultIdentity(): Promise<FabricIdentity> {
        const identities = await this.readAll();
        const defaultIdentity = identities.find(id => id.clinicId === this.defaultClinicId);
        if (!defaultIdentity) {
            throw new HttpException(404, 'Default identity not found');
        }
        return defaultIdentity;
    }

    public async deleteIdentity(clinicId: string): Promise<void> {
        const identities = await this.readAll();
        const index = identities.findIndex(id => id.clinicId === clinicId);

        if (index === -1) {
            throw new HttpException(404, `Identity not found for clinic: ${clinicId}`);
        }

        identities.splice(index, 1);
        await this.persistToStorage(identities);

        console.log(`🗑️  Deleted identity for clinic: ${clinicId}`);
    }

    public async hasIdentity(clinicId: string): Promise<boolean> {
        const identities = await this.readAll();
        return identities.some(id => id.clinicId === clinicId);
    }


    private validateIdentity(identity: FabricIdentity): void {
        if (!identity.clinicId || identity.clinicId.trim() === '') {
            throw new HttpException(400, 'Clinic ID is required');
        }

        if (!identity.mspId || identity.mspId.trim() === '') {
            throw new HttpException(400, 'MSP ID is required');
        }

        if (!identity.certificate || !identity.certificate.includes('BEGIN CERTIFICATE')) {
            throw new HttpException(400, 'Invalid certificate PEM format');
        }

        if (!identity.privateKey || !identity.privateKey.includes('BEGIN')) {
            throw new HttpException(400, 'Invalid private key PEM format');
        }

        if (!identity.peerEndpoint || !identity.peerEndpoint.includes(':')) {
            throw new HttpException(400, 'Invalid peer endpoint format (expected host:port)');
        }

        if (!identity.tlsCertificate || !identity.tlsCertificate.includes('BEGIN CERTIFICATE')) {
            throw new HttpException(400, 'Invalid TLS certificate PEM format');
        }
    }


    private async persistToStorage(identities: FabricIdentity[]): Promise<void> {
        const toStore = identities.map(identity => ({
            ...identity,
            privateKey: this.encrypt(identity.privateKey),
        }));

        await fs.writeFile(
            this.storagePath,
            JSON.stringify(toStore, null, 2),
            { mode: 0o600 } // Read/write only for owner
        );
    }

    private encrypt(plaintext: string): string {
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv('aes-256-gcm', this.encryptionKey, iv);
        
        let encrypted = cipher.update(plaintext, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        
        const authTag = cipher.getAuthTag();
        

        return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
    }


    private decrypt(ciphertext: string): string {
        if (!ciphertext.includes(':')) {
            // Data is not encrypted
            return ciphertext;
        }

        const [ivHex, authTagHex, encrypted] = ciphertext.split(':');
        
        const iv = Buffer.from(ivHex, 'hex');
        const authTag = Buffer.from(authTagHex, 'hex');
        
        const decipher = crypto.createDecipheriv('aes-256-gcm', this.encryptionKey, iv);
        decipher.setAuthTag(authTag);
        
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        
        return decrypted;
    }

    private sanitizeIdentity(identity: FabricIdentity): FabricIdentity {
        return {
            ...identity,
            privateKey: '[REDACTED]',
        };
    }
}

export default new IdentityStorageService();