import { promises } from 'dns';
import { port } from 'envalid'
import {create, IPFSHTTPClient} from 'ipfs-http-client'
import { HttpException } from '@/exceptions/HttpException';

// temp --> selecting the pinning service (4EVERLAND)
const ipfs_client: IPFSHTTPClient = create({
    host: process.env.IPFS_HOST,
    port: parseInt(process.env.IPFS_PORT),
    protocol: process.env.IPFS_PROTOCOL
});


// upload med file to IPFS --> generate and return CID
export const uploadFile = async(fileData: Buffer, fileName: string): Promise<string> => {
    try{
        const result = await ipfs_client.add({
            path: fileName,
            content: fileData,
        });
        const cid = result.cid.toString();
        return cid
    }
    catch(e){
        console.error('failed to upload to IPFS', e);
        throw new HttpException(500, 'failed to upload to IPFS');
    }
};


// get file using CID
export const getFile = async (cid: string): Promise<Buffer> => {
    try{
        // note --> each chunk in ipfs is Uint8Array
        const chunks: Uint8Array[] = [];

        for await (const chunk of ipfs_client.cat(cid)){
            chunks.push(chunk);
        }
        const fileData = Buffer.concat(chunks);
        return fileData;
    }
    catch(e){
        console.error('failed to retrieve from IPFS:', e)
        throw new HttpException(404, 'file not found')
    }
}

// pin management --> TBD