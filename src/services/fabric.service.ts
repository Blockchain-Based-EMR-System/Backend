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

  public async getGatewayConnection(clinicId: string, forceNew = false): Promise<GatewayConnection> {
    if (forceNew) {
      const stale = this.connections.get(clinicId);
      if (stale) {
        try { stale.gateway.close(); } catch (_) {}
        try { stale.client.close(); } catch (_) {}
        this.connections.delete(clinicId);
        console.log(`🔄 Evicted stale connection for clinic: ${clinicId}`);
      }
    } else {
      const cached = this.connections.get(clinicId);
      if (cached) {
        cached.lastUsed = new Date();
        return cached;
      }
    }

    const identity = await identityStorage.getIdentity(clinicId);
    const connection = await this.createConnection(identity);
    this.connections.set(clinicId, connection);

    console.log(`✅ Created new gateway connection for clinic: ${clinicId}`);
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
      console.error(`❌ Failed to create connection for clinic ${identity.clinicId}:`, error.message);
      throw new HttpException(503, `Failed to connect to Fabric network: ${error.message}`);
    }
  }

  private async newGrpcConnection(identity: FabricIdentity): Promise<grpc.Client> {
    // gRPC requires the PEM to end with a newline — ensure it regardless of how it was stored
    const tlsPem = identity.tlsCertificate.endsWith('\n') ? identity.tlsCertificate : identity.tlsCertificate + '\n';
    const tlsRootCert = Buffer.from(tlsPem);
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

  public async initLedger(clinicId: string, backupData: MedicalRecord[] = []): Promise<void> {
    const { contract } = await this.getGatewayConnection(clinicId);
    console.log(`\n--> Submit Transaction: InitLedger (clinic: ${clinicId}, records: ${backupData.length})`);
    await contract.submitTransaction('InitLedger', JSON.stringify(backupData));
    console.log('*** InitLedger transaction committed successfully');
  }

  public async storeRecordKey(clinicId: string, patientId: string, recordId: string, encryptedDEK: string): Promise<void> {
    const { contract } = await this.getGatewayConnection(clinicId);
    console.log(`\n--> Submit Transaction: StoreRecordKey (clinic: ${clinicId}, patient: ${patientId}, record: ${recordId})`);
    await contract.submit('StoreRecordKey', {
      arguments: [patientId, recordId],
      transientData: { encryptedDEK: Buffer.from(encryptedDEK) },
    });
  }

  public async getRecordKey(clinicId: string, patientId: string, recordId: string): Promise<string> {
    const { contract } = await this.getGatewayConnection(clinicId);
    console.log(`\n--> Evaluate Transaction: GetRecordKey (clinic: ${clinicId}, patient: ${patientId}, record: ${recordId})`);
    const resultBytes = await contract.evaluateTransaction('GetRecordKey', patientId, recordId);
    return this.utf8Decoder.decode(resultBytes);
  }

  public async recordKeyExists(clinicId: string, patientId: string, recordId: string): Promise<boolean> {
    const { contract } = await this.getGatewayConnection(clinicId);
    console.log(`\n--> Evaluate Transaction: RecordKeyExists (clinic: ${clinicId}, patient: ${patientId}, record: ${recordId})`);
    const resultBytes = await contract.evaluateTransaction('RecordKeyExists', patientId, recordId);
    return this.utf8Decoder.decode(resultBytes) === 'true';
  }

  public async getAllRecords(clinicId: string): Promise<MedicalRecord[]> {
    const { contract } = await this.getGatewayConnection(clinicId);
    console.log(`\n--> Evaluate Transaction: GetAllRecords (clinic: ${clinicId})`);
    const resultBytes = await contract.evaluateTransaction('GetAllRecords');
    const resultJson = this.utf8Decoder.decode(resultBytes);
    return JSON.parse(resultJson) as MedicalRecord[];
  }

  public async addRecord(clinicId: string, payload: MedicalRecord): Promise<void> {
    const { contract } = await this.getGatewayConnection(clinicId);
    console.log(`\n--> Submit Transaction: AddRecord (clinic: ${clinicId})`);

    await contract.submit('AddRecord', {
      arguments: [payload.patientId, payload.recordId, payload.doctorId, payload.type],
      transientData: {
        ipfsCid: Buffer.from(payload.ipfsCidKey),
      },
    });
  }

  public async getRecordsByPatient(clinicId: string, patientId: string, retry = true): Promise<MedicalRecord[]> {
    const { contract } = await this.getGatewayConnection(clinicId);
    console.log(`\n--> Evaluate Transaction: GetRecordsByPatient (clinic: ${clinicId}, patient: ${patientId})`);

    try {
      const resultBytes = await contract.evaluateTransaction('GetRecordsByPatient', patientId);

      const resultJson = this.utf8Decoder.decode(resultBytes);
      return JSON.parse(resultJson) as MedicalRecord[];
    } catch (err: unknown) {
      const msg = (err instanceof Error ? err.message : String(err)) || '';
      console.error(`❌ GetRecordsByPatient error for clinic ${clinicId}:`, err);
      if (msg.toLowerCase().includes('not authorized')) {
        throw new HttpException(403, `Access denied for clinic ${clinicId} to records of patient ${patientId}`, msg);
      }
      // ABORTED (gRPC code 10) usually means the channel is stale — evict and retry once
      if (retry && (msg.includes('ABORTED') || msg.includes('10 ABORTED'))) {
        console.warn(`⚠️  ABORTED on GetRecordsByPatient for clinic ${clinicId}, retrying with fresh connection...`);
        await this.getGatewayConnection(clinicId, true);
        return this.getRecordsByPatient(clinicId, patientId, false);
      }
      throw err;
    }
  }

  public async grantAccess(clinicId: string, patientId: string, targetClinic: string): Promise<void> {
    const { contract } = await this.getGatewayConnection(clinicId);
    console.log(`\n--> Submit Transaction: GrantAccess (clinic: ${clinicId}, patient: ${patientId})`);
    const targetMsp = (await identityStorage.getIdentity(targetClinic)).mspId;
    await contract.submitTransaction('GrantAccess', patientId, targetMsp);
  }

  public async updateRecord(clinicId: string, patientId: string, payload: Omit<MedicalRecord, 'patientId'>): Promise<void> {
    const { contract, identity } = await this.getGatewayConnection(clinicId);
    console.log(`\n--> Submit Transaction: UpdateRecord (clinic: ${clinicId})`);

    const transientData: Record<string, Buffer> = {};
    if (payload.ipfsCidKey) {
      transientData.ipfsCid = Buffer.from(payload.ipfsCidKey);
    }

    await contract.submit('UpdateRecord', {
      arguments: [patientId, payload.recordId, payload.doctorId, payload.type],
      ...(Object.keys(transientData).length > 0 ? { transientData } : {}),
    });
  }

  public async deleteRecord(clinicId: string, patientId: string, recordId: string): Promise<void> {
    const { contract } = await this.getGatewayConnection(clinicId);
    console.log(`\n--> Submit Transaction: DeleteRecord (clinic: ${clinicId}, patient: ${patientId}, record: ${recordId})`);
    await contract.submitTransaction('DeleteRecord', patientId, recordId);
  }

  public async closeConnection(clinicId: string): Promise<void> {
    const connection = this.connections.get(clinicId);
    if (connection) {
      connection.gateway.close();
      connection.client.close();
      this.connections.delete(clinicId);
      console.log(`Closed connection for clinic: ${clinicId}`);
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
    this.cleanupInterval = setInterval(
      () => {
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
      },
      5 * 60 * 1000,
    ); // Check every 5 minutes
  }

  public getConnectionStats(): { total: number; connections: Array<{ clinicId: string; lastUsed: string }> } {
    return {
      total: this.connections.size,
      connections: Array.from(this.connections.entries()).map(([clinicId, conn]) => ({
        clinicId,
        lastUsed: conn.lastUsed.toISOString(),
      })),
    };
  }
}

export default FabricService;
