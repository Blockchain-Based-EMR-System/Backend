import * as grpc from '@grpc/grpc-js';
import { connect, Contract, Gateway, Identity, Signer, signers } from '@hyperledger/fabric-gateway';
import * as crypto from 'crypto';
import { TextDecoder } from 'util';
import { HttpException } from '@/exceptions/HttpException';
import { MedicalRecord } from '@/interfaces/medical-records.interface';
import { FabricIdentity } from '@/interfaces/fabric-identity.interface';
import identityStorage from '@/services/identity-storage.service';


interface GatewayConnection {
    gateway: Gateway;
    client: grpc.Client;
    contract: Contract;
    identity: FabricIdentity;
    lastUsed: Date;
}

class FabricService {
    private readonly utf8Decoder = new TextDecoder();
    
    // Connection cache with TTL
    private connections: Map<string, GatewayConnection> = new Map();
    private readonly CONNECTION_TTL_MS = 30 * 60 * 1000; // 30 minutes
    private cleanupInterval: NodeJS.Timeout | null = null;

    constructor() {
        this.startCleanupInterval();
    }

    public async getGatewayConnection(identityLabel: string): Promise<GatewayConnection> {

        const cached = this.connections.get(identityLabel);
        if (cached) {
            cached.lastUsed = new Date();
            return cached;
        }

        const identity = await identityStorage.getIdentity(identityLabel);
        const connection = await this.createConnection(identity);
        this.connections.set(identityLabel, connection);

        console.log(`✅ Created new gateway connection for: ${identityLabel}`);
        return connection;
    }

    private async createConnection(identity: FabricIdentity): Promise<GatewayConnection> {
        try {

            const client = await this.newGrpcConnection(identity);


            const gateway = connect({
                client,
                identity: this.createIdentity(identity),
                signer: this.createSigner(identity),
            });


            const network = gateway.getNetwork(identity.channelName);
            const contract = network.getContract(identity.chaincodeName);

            return {
                gateway,
                client,
                contract,
                identity,
                lastUsed: new Date(),
            };
        } catch (error: any) {
            console.error(`❌ Failed to create connection for ${identity.label}:`, error.message);
            throw new HttpException(503, `Failed to connect to Fabric network: ${error.message}`);
        }
    }

    private async newGrpcConnection(identity: FabricIdentity): Promise<grpc.Client> {
        const tlsRootCert = Buffer.from(identity.tlsCertificate);
        const tlsCredentials = grpc.credentials.createSsl(tlsRootCert);
        
        return new grpc.Client(identity.peerEndpoint, tlsCredentials, {
            'grpc.ssl_target_name_override': identity.peerHostAlias,
            'grpc.keepalive_time_ms': 120000,
            'grpc.http2.min_time_between_pings_ms': 120000,
            'grpc.keepalive_timeout_ms': 20000,
            'grpc.http2.max_pings_without_data': 0,
            'grpc.keepalive_permit_without_calls': 1,
        });
    }

    private createIdentity(identity: FabricIdentity): Identity {
        return {
            mspId: identity.mspId,
            credentials: Buffer.from(identity.certificate),
        };
    }

    private createSigner(identity: FabricIdentity): Signer {
        const privateKey = crypto.createPrivateKey(identity.privateKey);
        return signers.newPrivateKeySigner(privateKey);
    }

    public async initLedger(identityLabel: string): Promise<void> {
        const { contract } = await this.getGatewayConnection(identityLabel);
        console.log(`\n--> Submit Transaction: InitLedger (${identityLabel})`);
        await contract.submitTransaction('InitLedger');
        console.log('*** InitLedger transaction committed successfully');
    }


    public async getAllRecords(identityLabel: string): Promise<MedicalRecord[]> {
        const { contract } = await this.getGatewayConnection(identityLabel);
        console.log(`\n--> Evaluate Transaction: GetAllRecords (${identityLabel})`);
        const resultBytes = await contract.evaluateTransaction('GetAllRecords');
        const resultJson = this.utf8Decoder.decode(resultBytes);
        return JSON.parse(resultJson) as MedicalRecord[];
    }

    public async addRecord(identityLabel: string, payload: MedicalRecord): Promise<void> {
        const { contract, identity } = await this.getGatewayConnection(identityLabel);
        console.log(`\n--> Submit Transaction: AddRecord (${identityLabel})`);
        
        await contract.submit('AddRecord', {
            arguments: [
                payload.patientId,
                payload.firstName,
                payload.lastName,
                payload.dateOfBirth,
                payload.gender,
                payload.bloodType,
                payload.summary || '',
            ],
            transientData: {
                ipfsCid: Buffer.from(payload.ipfsCid)
            },
            endorsingOrganizations: [identity.mspId],
        });
    }

    public async getRecordByPatientId(identityLabel: string, patientId: string): Promise<MedicalRecord> {
        const { contract, identity } = await this.getGatewayConnection(identityLabel);
        console.log(`\n--> Evaluate Transaction: GetRecord (${identityLabel})`);

        // First, fetch the public metadata so we can determine the Owner MSP for this record.
        // We don't have a separate "GetRecordPublic" chaincode function, so reuse GetAllRecords
        // and find the single entry. For large datasets consider adding a light-weight metadata accessor.
        const allBytes = await contract.evaluateTransaction('GetAllRecords');
        const allJson = this.utf8Decoder.decode(allBytes);
        const allRecords = JSON.parse(allJson) as MedicalRecord[];

        const publicRecord = allRecords.find(r => r.patientId === patientId);
        if (!publicRecord) {
            throw new HttpException(404, `Record not found: ${patientId}`);
        }

        const ownerMsp = publicRecord.ownerMsp || publicRecord.ownerMsp?.toString();

        // If caller is the owner, perform a normal evaluate (owner peer will have private data).
        // If caller is NOT the owner, we must ensure the proposal is evaluated on the owner's peers
        // so they can read their implicit private data collection. We instruct the gateway to target
        // the owner's organizations for endorsement.
        const callerMsp = identity.mspId;

        try {
            if (callerMsp === ownerMsp) {
                const resultBytes = await contract.evaluateTransaction('GetRecord', patientId);
                const resultJson = this.utf8Decoder.decode(resultBytes);
                return JSON.parse(resultJson) as MedicalRecord;
            }

            // Non-owner: request evaluation targeted at owner's org so that owner's peer can access private data.
            const resultBytes = await contract.evaluate('GetRecord', {
                arguments: [patientId],
                endorsingOrganizations: [ownerMsp],
            });

            const resultJson = this.utf8Decoder.decode(resultBytes);
            return JSON.parse(resultJson) as MedicalRecord;
        } catch (err: any) {
            // Surface clearer error when access is denied
            const msg = err?.message || String(err);
            if (msg.toLowerCase().includes('not authorized') || msg.toLowerCase().includes('not authorized to access')) {
                throw new HttpException(403, `Access denied for ${identityLabel} to record ${patientId}`, msg);
            }
            throw err;
        }
    }

    public async grantAccess(identityLabel: string, patientId: string, targetMsp: string): Promise<void> {
        const { contract } = await this.getGatewayConnection(identityLabel);
        console.log(`\n--> Submit Transaction: GrantAccess (${identityLabel})`);
        await contract.submitTransaction('GrantAccess', patientId, targetMsp);
    }


    public async updateRecord(
        identityLabel: string,
        patientId: string,
        payload: Omit<MedicalRecord, 'patientId'>
    ): Promise<void> {
        const { contract, identity } = await this.getGatewayConnection(identityLabel);
        console.log(`\n--> Submit Transaction: UpdateRecord (${identityLabel})`);
        
        await contract.submit('UpdateRecord', {
            arguments: [
                patientId,
                payload.firstName,
                payload.lastName,
                payload.dateOfBirth,
                payload.gender,
                payload.bloodType,
                payload.summary || '',
            ],
            transientData: {
                ipfsCid: Buffer.from(payload.ipfsCid)
            },
            endorsingOrganizations: [identity.mspId],
        });
    }

    public async closeConnection(identityLabel: string): Promise<void> {
        const connection = this.connections.get(identityLabel);
        if (connection) {
            connection.gateway.close();
            connection.client.close();
            this.connections.delete(identityLabel);
            console.log(`Closed connection for: ${identityLabel}`);
        }
    }

    public closeAllConnections(): void {
        for (const [label, connection] of this.connections) {
            connection.gateway.close();
            connection.client.close();
            console.log(`Closed connection for: ${label}`);
        }
        this.connections.clear();

        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
        }
    }


    private startCleanupInterval(): void {
        this.cleanupInterval = setInterval(() => {
            const now = new Date().getTime();
            
            for (const [label, connection] of this.connections) {
                const age = now - connection.lastUsed.getTime();
                if (age > this.CONNECTION_TTL_MS) {
                    connection.gateway.close();
                    connection.client.close();
                    this.connections.delete(label);
                    console.log(`Cleaned up stale connection for: ${label}`);
                }
            }
        }, 5 * 60 * 1000); // Check every 5 minutes
    }


    public getConnectionStats(): { total: number; connections: Array<{ label: string; lastUsed: string }> } {
        return {
            total: this.connections.size,
            connections: Array.from(this.connections.entries()).map(([label, conn]) => ({
                label,
                lastUsed: conn.lastUsed.toISOString(),
            })),
        };
    }
}

export default FabricService;