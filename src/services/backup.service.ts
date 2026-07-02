import fs from 'fs';
import path from 'path';
import { MedicalRecord } from '@/interfaces/medical-records.interface';

export class BackupService {
  private backupFilePath: string;
  private keysFilePath: string;

  constructor() {
    const dataDir = path.join(__dirname, '../../data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    this.backupFilePath = path.join(dataDir, 'backup_records.json');
    this.keysFilePath = path.join(dataDir, 'backup_keys.json');
    if (!fs.existsSync(this.backupFilePath)) {
      fs.writeFileSync(this.backupFilePath, JSON.stringify([]));
    }
    if (!fs.existsSync(this.keysFilePath)) {
      fs.writeFileSync(this.keysFilePath, JSON.stringify({}));
    }
  }

  private readBackup(): MedicalRecord[] {
    try {
      const data = fs.readFileSync(this.backupFilePath, 'utf8');
      const records: MedicalRecord[] = JSON.parse(data).filter((r: MedicalRecord) => !r.deleted);
      return records;
    } catch (error) {
      console.error('Error reading backup file:', error);
      return [];
    }
  }

  private writeBackup(records: MedicalRecord[]): void {
    try {
      fs.writeFileSync(this.backupFilePath, JSON.stringify(records, null, 2));
    } catch (error) {
      console.error('Error writing to backup file:', error);
    }
  }

  private readKeys(): Record<string, string> {
    try {
      const data = fs.readFileSync(this.keysFilePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error reading keys file:', error);
      return {};
    }
  }

  private writeKeys(keys: Record<string, string>): void {
    try {
      fs.writeFileSync(this.keysFilePath, JSON.stringify(keys, null, 2));
    } catch (error) {
      console.error('Error writing to keys file:', error);
    }
  }

  public addRecord(record: MedicalRecord, ownerMsp: string): void {
    const records = this.readBackup();
    const existingIndex = records.findIndex(r => r.recordId === record.recordId && r.patientId === record.patientId);
    if (existingIndex === -1) {
      records.push({
        ...record,
        ownerMsp,
        authorizedMsps: record.authorizedMsps || [],
      });
      this.writeBackup(records);
    }
  }

  public getRecordsByPatient(patientId: string, clientMspId: string): MedicalRecord[] {
    const records = this.readBackup();
    return records.filter(r => {
      if (r.patientId !== patientId) return false;
      if (r.deleted) {
        return false;
      }
      if (clientMspId === 'admin' || r.ownerMsp === clientMspId) {
        return true;
      }

      // Check authorized list
      if (r.authorizedMsps && r.authorizedMsps.includes(clientMspId)) {
        return true;
      }
    
      return false;
    });
  }

  public getAllRecords(): MedicalRecord[] {
    return this.readBackup();
  }

  public updateRecord(patientId: string, payload: Omit<MedicalRecord, 'patientId'>): void {
    const records = this.readBackup();
    const index = records.findIndex(r => r.recordId === payload.recordId && r.patientId === patientId);
    if (index !== -1) {
      records[index] = { ...records[index], ...payload };
      this.writeBackup(records);
    }
  }
  public deleteRecord(patientId: string, recordId: string): void {
    const records = this.readBackup();
    const index = records.findIndex(r => r.recordId === recordId && r.patientId === patientId);
    if (index !== -1) {
      records[index].deleted = true;
      this.writeBackup(records);
    }
  }

  public grantAccess(patientId: string, clientMspId: string, targetMsp: string): void {
    const records = this.readBackup();
    let updated = false;
    for (const record of records) {
      if (record.patientId === patientId && record.ownerMsp === clientMspId) {
        if (!record.authorizedMsps) {
          record.authorizedMsps = [];
        }
        if (!record.authorizedMsps.includes(targetMsp)) {
          record.authorizedMsps.push(targetMsp);
          updated = true;
        }
      }
    }
    if (updated) {
      this.writeBackup(records);
    }
  }

  public storeRecordKey(patientId: string, recordId: string, encryptedDEK: string): void {
    const keys = this.readKeys();
    keys[`${patientId}:${recordId}`] = encryptedDEK;
    this.writeKeys(keys);
  }

  public getRecordKey(patientId: string, recordId: string): string {
    const keys = this.readKeys();
    const key = keys[`${patientId}:${recordId}`];
    if (!key) {
      throw new Error(`DEK not found in backup for patient ${patientId} and record ${recordId}`);
    }
    return key;
  }

  public recordKeyExists(patientId: string, recordId: string): boolean {
    const keys = this.readKeys();
    return !!keys[`${patientId}:${recordId}`];
  }

  public deleteAllRecords(): void {
    try {
      this.writeBackup([]);
      this.writeKeys({});
    } catch (error) {
      console.error('Error clearing backup file:', error);
    }
  }
}

export const backupService = new BackupService();
