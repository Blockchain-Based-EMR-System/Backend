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
            // CID → gateway URL → HTTP request → raw bytes stream → read all bytes → Buffer
            const url = `https://${process.env.PINATA_GATEWAY}/files/${cid}?pinataGatewayToken=${process.env.PINATA_GATEWAY_TOKEN}`;
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`Gateway responded with ${response.status}`);
            }

            const arrayBuffer = await response.arrayBuffer();
            return Buffer.from(arrayBuffer);
        } catch (e) {
            throw new HttpException(500, `IPFS fetch failed: ${e.message}`);
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