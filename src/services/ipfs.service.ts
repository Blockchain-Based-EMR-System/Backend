import { PinataSDK } from 'pinata';
import { HttpException } from '@/exceptions/HttpException';
import { Service } from 'typedi';
import { Blob, File } from 'buffer';

@Service()
export class IpfsService {
    private pinata: PinataSDK;

    constructor() {
        this.pinata = new PinataSDK({
            pinataJwt: process.env.PINATA_JWT,
            pinataGateway: process.env.PINATA_GATEWAY,
        });
    }

    public async uploadFile(fileData: Buffer, fileName: string, mimeType: string): Promise<string> {
        try {
            const file = new File([fileData], fileName, { type: mimeType });
            const upload = await this.pinata.upload.file(file);
            return upload.cid;
        }
        catch (e) {
            throw new HttpException(500, `IPFS upload failed: ${e.message}`);
        }
    }

    public async getFile(cid: string): Promise<Buffer> {
        try {
            const response = await this.pinata.gateways.get(cid);

            if (response.data instanceof Blob) {
                const arrayBuffer = await response.data.arrayBuffer();
                return Buffer.from(arrayBuffer);
            }
            return Buffer.from(response.data as string, 'binary');
        } 
        catch (e) {
            throw new HttpException(500, `IPFS fetch failed: ${e.message}`);
        }
    }

    public async checkHealth(): Promise<{ status: string; message: string }> {
        try {
            await this.pinata.testAuthentication();
            return { status: 'ok', message: 'IPFS connection is healthy' };
        } catch (e) {
            throw new HttpException(503, `IPFS connection failed: ${e.message}`);
        }
    }

    public async deleteFile(cid: string): Promise<void> {
        try {
            await this.pinata.files.delete([cid]);
        }
        catch (e) {
            throw new HttpException(500, `IPFS delete failed: ${e.message}`);
        }
    }
}