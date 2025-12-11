import { promises as fs } from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { FabricIdentity, FabricIdentityInput } from '@/interfaces/fabric-identity.interface';
import { HttpException } from '@/exceptions/HttpException';

class IdentityStorageService {
    private readonly storagePath: string;
    private readonly encryptionKey: Buffer;
    private identities: Map<string, FabricIdentity> = new Map();
    private initialized: boolean = false;

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

    public async initialize(): Promise<void> {
        if (this.initialized) return;

        try {
            const dir = path.dirname(this.storagePath);
            await fs.mkdir(dir, { recursive: true });

            const data = await fs.readFile(this.storagePath, 'utf-8');
            const stored = JSON.parse(data) as FabricIdentity[];
            
            for (const identity of stored) {
                identity.privateKey = this.decrypt(identity.privateKey);
                this.identities.set(identity.label, identity);
            }
            
            console.log(`Loaded ${this.identities.size} Fabric identities from storage`);
        } catch (error: any) {
            if (error.code === 'ENOENT') {
                console.log('No existing identity storage found. Starting fresh.');
            } else {
                console.error('Error loading identity storage:', error.message);
            }
        }

        this.initialized = true;
    }


    public async storeIdentity(input: FabricIdentityInput): Promise<FabricIdentity> {
        await this.initialize();

        const now = new Date().toISOString();
        const existing = this.identities.get(input.label);

        const identity: FabricIdentity = {
            label: input.label,
            mspId: input.mspId,
            certificate: input.certificate,
            privateKey: input.privateKey,
            peerEndpoint: input.peerEndpoint,
            peerHostAlias: input.peerHostAlias,
            tlsCertificate: input.tlsCertificate,
            channelName: input.channelName || 'mychannel',
            chaincodeName: input.chaincodeName || 'emr',
            createdAt: existing?.createdAt || now,
            updatedAt: now,
        };


        this.validateIdentity(identity);

        this.identities.set(identity.label, identity);
        await this.persistToStorage();

        console.log(`✅ Stored identity: ${identity.label} (MSP: ${identity.mspId})`);
        

        return this.sanitizeIdentity(identity);
    }


    public async getIdentity(label: string): Promise<FabricIdentity> {
        await this.initialize();

        const identity = this.identities.get(label);
        if (!identity) {
            throw new HttpException(404, `Identity not found: ${label}`);
        }

        return identity;
    }

    public async listIdentities(): Promise<Array<Omit<FabricIdentity, 'privateKey' | 'certificate' | 'tlsCertificate'>>> {
        await this.initialize();

        return Array.from(this.identities.values()).map(identity => ({
            label: identity.label,
            mspId: identity.mspId,
            peerEndpoint: identity.peerEndpoint,
            peerHostAlias: identity.peerHostAlias,
            channelName: identity.channelName,
            chaincodeName: identity.chaincodeName,
            createdAt: identity.createdAt,
            updatedAt: identity.updatedAt,
        }));
    }

    public async deleteIdentity(label: string): Promise<void> {
        await this.initialize();

        if (!this.identities.has(label)) {
            throw new HttpException(404, `Identity not found: ${label}`);
        }

        this.identities.delete(label);
        await this.persistToStorage();

        console.log(`🗑️  Deleted identity: ${label}`);
    }

    public async hasIdentity(label: string): Promise<boolean> {
        await this.initialize();
        return this.identities.has(label);
    }


    private validateIdentity(identity: FabricIdentity): void {
        if (!identity.label || identity.label.trim() === '') {
            throw new HttpException(400, 'Identity label is required');
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


    private async persistToStorage(): Promise<void> {
        const toStore = Array.from(this.identities.values()).map(identity => ({
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