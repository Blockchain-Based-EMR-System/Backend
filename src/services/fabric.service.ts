import * as grpc from '@grpc/grpc-js';
import { connect, Contract, Gateway, Identity, Signer, signers } from '@hyperledger/fabric-gateway';
import * as crypto from 'crypto';
import { promises as fs } from 'fs';
import * as path from 'path';
import { TextDecoder } from 'util';
import { HttpException } from '@/exceptions/HttpException';
import { MedicalRecord } from '@/interfaces/medical-records.interface';

class FabricService {
    private gateway: Gateway | undefined;
    private contract: Contract | undefined;
    private readonly utf8Decoder = new TextDecoder();

    // Configuration - should be moved to your config/index.ts and .env file
    private readonly channelName = process.env.CHANNEL_NAME || 'mychannel';
    private readonly chaincodeName = process.env.CHAINCODE_NAME || 'test';
    private readonly mspId = process.env.MSP_ID || 'Org1MSP';
    private readonly cryptoPath = process.env.CRYPTO_PATH || path.resolve(__dirname, '../../../Blockchain/test-network/organizations/peerOrganizations/org1.example.com');
    private readonly keyDirectoryPath = process.env.KEY_DIRECTORY_PATH || path.resolve(this.cryptoPath, 'users', 'User1@org1.example.com', 'msp', 'keystore');
    private readonly certDirectoryPath = process.env.CERT_DIRECTORY_PATH || path.resolve(this.cryptoPath, 'users', 'User1@org1.example.com', 'msp', 'signcerts');
    private readonly tlsCertPath = process.env.TLS_CERT_PATH || path.resolve(this.cryptoPath, 'peers', 'peer0.org1.example.com', 'tls', 'ca.crt');
    private readonly peerEndpoint = process.env.PEER_ENDPOINT || 'localhost:7051';
    private readonly peerHostAlias = process.env.PEER_HOST_ALIAS || 'peer0.org1.example.com';
    private client: grpc.Client | undefined;

    constructor() {
        this.connectToNetwork().catch(error => {
            console.error('Failed to connect to Fabric network on initialization:', error);
            process.exit(1);
        });
    }

    private async connectToNetwork(): Promise<void> {
        try {
            this.client = await this.newGrpcConnection();
            this.gateway = connect({
                client: this.client,
                identity: await this.newIdentity(),
                signer: await this.newSigner(),
            });
            const network = this.gateway.getNetwork(this.channelName);
            this.contract = network.getContract(this.chaincodeName);
            await this.initLedger();
            console.log('*** Fabric Service Initialized and Ledger Ready ***');
        } catch (error) {
            console.error('fabric network not connected');
            // Do not throw to avoid crashing the application during startup.
            // Leave gateway/client/contract undefined so callers can detect uninitialized service.
            this.gateway = undefined;
            this.client = undefined;
            this.contract = undefined;
            return;
        }
    }

    public async getAllRecords(): Promise<MedicalRecord[]> {
        const contract = this.ensureContract();
        console.log('\n--> Evaluate Transaction: GetAllRecords');
        const resultBytes = await contract.evaluateTransaction('GetAllRecords');
        const resultJson = this.utf8Decoder.decode(resultBytes);
        return JSON.parse(resultJson) as MedicalRecord[];
    }

    public async addRecord(payload: MedicalRecord): Promise<void> {
        const contract = this.ensureContract();
        console.log('\n--> Submit Transaction: AddRecord');
        await contract.submitTransaction(
            'AddRecord',
            payload.patientId,
            payload.firstName,
            payload.lastName,
            payload.dateOfBirth,
            payload.gender,
            payload.bloodType,
            payload.ipfsCid,
            payload.summary || '',
        );
    }

    public async getRecordByPatientId(patientId: string): Promise<MedicalRecord> {
        const contract = this.ensureContract();
        console.log('\n--> Evaluate Transaction: GetRecord');
        const resultBytes = await contract.evaluateTransaction('GetRecord', patientId);
        const resultJson = this.utf8Decoder.decode(resultBytes);
        return JSON.parse(resultJson) as MedicalRecord;
    }

    public async updateRecord(patientId: string, payload: Omit<MedicalRecord, 'patientId'>): Promise<void> {
        const contract = this.ensureContract();
        console.log('\n--> Submit Transaction: UpdateRecord');
        await contract.submitTransaction(
            'UpdateRecord',
            patientId,
            payload.firstName,
            payload.lastName,
            payload.dateOfBirth,
            payload.gender,
            payload.bloodType,
            payload.ipfsCid,
            payload.summary || '',
        );
    }

    private async initLedger(): Promise<void> {
        const contract = this.ensureContract();
        console.log('\n--> Submit Transaction: InitLedger');
        await contract.submitTransaction('InitLedger');
        console.log('*** InitLedger transaction committed successfully');
    }

    private ensureContract(): Contract {
        if (!this.contract) {
            throw new HttpException(503, 'Fabric network connection is not ready');
        }
        return this.contract;
    }

    private async newGrpcConnection(): Promise<grpc.Client> {
        const tlsRootCert = await fs.readFile(this.tlsCertPath);
        const tlsCredentials = grpc.credentials.createSsl(tlsRootCert);
        return new grpc.Client(this.peerEndpoint, tlsCredentials, {
            'grpc.ssl_target_name_override': this.peerHostAlias,
        });
    }

    private async newIdentity(): Promise<Identity> {
        const certPath = await this.getFirstDirFileName(this.certDirectoryPath);
        const credentials = await fs.readFile(certPath);
        return { mspId: this.mspId, credentials };
    }

    private async newSigner(): Promise<Signer> {
        const keyPath = await this.getFirstDirFileName(this.keyDirectoryPath);
        const privateKeyPem = await fs.readFile(keyPath);
        const privateKey = crypto.createPrivateKey(privateKeyPem);
        return signers.newPrivateKeySigner(privateKey);
    }

    private async getFirstDirFileName(dirPath: string): Promise<string> {
        const files = await fs.readdir(dirPath);
        if (!files[0]) {
            throw new Error(`No files in directory: ${dirPath}`);
        }
        return path.join(dirPath, files[0]);
    }

    public close(): void {
        this.gateway?.close();
        this.client?.close();
    }
}

export default FabricService;