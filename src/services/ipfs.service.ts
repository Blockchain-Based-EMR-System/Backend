import { PinataSDK } from 'pinata';
import { create, IPFSHTTPClient } from 'ipfs-http-client'
import { HttpException } from '@/exceptions/HttpException';
import { Service } from 'typedi';



@Service()
export class IpfsService {
    private ipfsClient: IPFSHTTPClient;

    constructor() {
        // temp --> selecting the pinning service (4EVERLAND)
        this.ipfsClient = create({
            host: process.env.IPFS_HOST,
            port: parseInt(process.env.IPFS_PORT),
            protocol: process.env.IPFS_PROTOCOL
        });
    }

    // upload med file to IPFS --> generate and return CID
    public async uploadFile(fileData: Buffer, fileName: string): Promise<string> {
        const result = await this.ipfsClient.add({
            path: fileName,
            content: fileData,
        });
        const cid = result.cid.toString();
        return cid
    };

    // get file using CID
    public async getFile(cid: string): Promise<Buffer> {
        // note --> each chunk in ipfs is Uint8Array
        const chunks: Uint8Array[] = [];

        for await (const chunk of this.ipfsClient.cat(cid)) {
            chunks.push(chunk);
        }
        const fileData = Buffer.concat(chunks);
        return fileData;
    }

    // pin management --> TBD


}