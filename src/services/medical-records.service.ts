import { HttpException } from '@/exceptions/HttpException';
import { CreateDoctorRecordJsonDto, CreateMedicalRecordDto } from '@/dtos/medical-records.dto';
import { MedicalRecord, MedicalRecordFile } from '@/interfaces/medicalRecords.interface';
import prisma from '@/config/prisma';
import { Prisma } from '@prisma/client';
import { Service } from 'typedi';
import { IpfsService } from '@/services/ipfs.service';
import { EncryptionService } from '@/services/encryption.service';
import { KeyManagementService } from '@/services/key-management.service';
import { createBilingualError, ErrorMessages } from '@/utils/errorMessages';
import { randomUUID } from 'crypto';
import FabricService from '@/services/fabric.service';
import { RecordType } from '@/interfaces/enums.interface';
import { IdentityStorageService } from '@/services/identity-storage.service';

@Service()
export class MedicalRecordService {
  private ipfsService = new IpfsService();
  private encryptionService = new EncryptionService();
  private keyManagementService = new KeyManagementService();
  private fabricService = new FabricService();
  private identityStorageService = new IdentityStorageService();

  public async createMedicalRecord(
    clinicId: string,
    patientId: string,
    doctorId: string,
    fileData: CreateMedicalRecordDto,
    fileBuffer: Buffer,
    fileName: string,
    mimeType: string,
  ): Promise<void> {
    const recordId = randomUUID();

    const recordDEK = await this.keyManagementService.getRecordDEK(clinicId, patientId, recordId);
    const encryptedFile = this.encryptionService.encryptFile(fileBuffer, recordDEK);
    recordDEK.fill(0);

    const cid = await this.ipfsService.uploadFile(encryptedFile, fileName, mimeType);

    await prisma.medicalRecord.create({
      data: {
        id: recordId,
        patient_id: patientId,
        doctor_id: doctorId,
        clinic_id: clinicId,
        appointment_id: (fileData as any).appointmentId,
        name: fileData.name,
        cid: cid,
        type: fileData.type,
        mime_type: mimeType,
      } as Prisma.MedicalRecordUncheckedCreateInput,
    });

    await this.fabricService.addRecord(clinicId, {
      patientId,
      recordId,
      doctorId,
      type: fileData.type,
      ipfsCidKey: cid,
    });
  }

  public async getRecordFile(callerClinicId: string, recordId: string): Promise<MedicalRecordFile> {
    const record = await prisma.medicalRecord.findFirst({
      where: {
        id: recordId,
        deleted_at: null,
      },
      select: {
        id: true,
        patient_id: true,
        clinic_id: true,
        doctor_id: true,
        appointment_id: true,
        name: true,
        type: true,
        mime_type: true,
        cid: true,
      },
    });

    if (!record) {
      const error = createBilingualError(404, ErrorMessages.RECORD_NOT_FOUND);
      throw new HttpException(error.status, error.message, error.messageAr);
    }

    const authorizedRecords = await this.fabricService.getRecordsByPatient(callerClinicId, record.patient_id);
    const isAuthorized = authorizedRecords.some(r => r.recordId === recordId);
    if (!isAuthorized) {
      throw new HttpException(403, 'Access denied: your clinic is not authorized to access this record');
    }

    const encryptedFile = await this.ipfsService.getFile(record.cid);

    const recordDEK = await this.keyManagementService.getRecordDEK(record.clinic_id, record.patient_id, record.id);
    const decryptedFile = this.encryptionService.decryptFile(encryptedFile, recordDEK);
    recordDEK.fill(0);

    return {
      id: record.id,
      patient_id: record.patient_id,
      clinic_id: record.clinic_id,
      doctor_id: record.doctor_id ?? undefined,
      appointment_id: record.appointment_id ?? undefined,
      name: record.name,
      type: record.type,
      mime_type: record.mime_type,
      cid: record.cid,
      buffer: decryptedFile,
    };
  }

  public async checkIpfsHealth(): Promise<{ status: string; message: string }> {
    return this.ipfsService.checkHealth();
  }

  public async getPatientFiles(patientId: string): Promise<MedicalRecord[]> {
    const records = await prisma.medicalRecord.findMany({
      where: {
        patient_id: patientId,
        deleted_at: null,
      },
      select: {
        id: true,
        patient_id: true,
        clinic_id: true,
        doctor_id: true,
        appointment_id: true,
        name: true,
        type: true,
        mime_type: true,
        cid: true,
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    return records.map(record => ({
      id: record.id,
      patient_id: record.patient_id,
      clinic_id: record.clinic_id,
      doctor_id: record.doctor_id ?? undefined,
      appointment_id: record.appointment_id ?? undefined,
      name: record.name,
      type: record.type,
      cid: record.cid,
      mime_type: record.mime_type,
    }));
  }

  public async deleteRecord(callerClinicId: string, recordId: string): Promise<void> {
    const record = await prisma.medicalRecord.findFirst({
      where: {
        id: recordId,
        deleted_at: null,
      },
    });

    if (!record) {
      const error = createBilingualError(404, ErrorMessages.RECORD_NOT_FOUND);
      throw new HttpException(error.status, error.message, error.messageAr);
    }

    if (record.deleted_at) {
      const error = createBilingualError(404, ErrorMessages.RECORD_ALREADY_DELETED);
      throw new HttpException(error.status, error.message, error.messageAr);
    }

    await this.fabricService.deleteRecord(callerClinicId, record.patient_id, recordId);

    await prisma.medicalRecord.update({
      where: { id: recordId },
      data: { deleted_at: new Date() },
    });
  }

  public async grantAccess(patientId: string, targetClinicId: string): Promise<void> {
    const records = await prisma.medicalRecord.findMany({
      where: { patient_id: patientId, deleted_at: null },
      select: { clinic_id: true },
    });

    const ownerClinicIds = [...new Set(records.map(r => r.clinic_id))];

    for (const ownerClinicId of ownerClinicIds) {
      await this.fabricService.grantAccess(ownerClinicId, patientId, targetClinicId);
    }
  }

  public async addDoctorRecord(clinicId: string, patientId: string, doctorId: string, dto: CreateDoctorRecordJsonDto): Promise<string> {
    const clinicDoctor = await prisma.clinicDoctor.findUnique({
      where: { clinic_id_doctor_id: { clinic_id: clinicId, doctor_id: doctorId } },
    });
    if (!clinicDoctor) {
      throw new HttpException(403, 'Doctor is not associated with this clinic');
    }

    const recordId = randomUUID();

    const contentBuffer = Buffer.from(JSON.stringify(dto.content), 'utf-8');
    const recordDEK = await this.keyManagementService.getRecordDEK(clinicId, patientId, recordId);
    const encryptedFile = this.encryptionService.encryptFile(contentBuffer, recordDEK);
    recordDEK.fill(0);

    const cid = await this.ipfsService.uploadFile(encryptedFile, `${recordId}.enc`, 'application/octet-stream');

    await prisma.medicalRecord.create({
      data: {
        id: recordId,
        patient_id: patientId,
        doctor_id: doctorId,
        clinic_id: clinicId,
        name: dto.name,
        cid: cid,
        type: dto.type,
        mime_type: 'application/json',
      } as Prisma.MedicalRecordUncheckedCreateInput,
    });

    await this.fabricService.addRecord(clinicId, {
      patientId,
      recordId,
      doctorId,
      type: dto.type,
      ipfsCidKey: cid,
    });

    return recordId;
  }

  public async getPatientRecordsForDoctor(callerClinicId: string, patientId: string): Promise<MedicalRecord[]> {
    const authorizedOnChain = await this.fabricService.getRecordsByPatient(callerClinicId, patientId);
    const authorizedIds = new Set(authorizedOnChain.map(r => r.recordId));

    const records = await prisma.medicalRecord.findMany({
      where: { patient_id: patientId, deleted_at: null },
      select: {
        id: true,
        patient_id: true,
        clinic_id: true,
        doctor_id: true,
        appointment_id: true,
        name: true,
        type: true,
        mime_type: true,
        cid: true,
      },
      orderBy: { created_at: 'desc' },
    });

    return records
      .filter(r => authorizedIds.has(r.id))
      .map(record => ({
        id: record.id,
        patient_id: record.patient_id,
        clinic_id: record.clinic_id,
        doctor_id: record.doctor_id ?? undefined,
        appointment_id: record.appointment_id ?? undefined,
        name: record.name,
        type: record.type,
        cid: record.cid,
        mime_type: record.mime_type,
      }));
  }

  public async getSOAPNotes(callerClinicId: string, patientId: string): Promise<Array<{ recordId: string; content: any }>> {
    const records = await prisma.medicalRecord.findMany({
      where: {
        patient_id: patientId,
        mime_type: 'application/json',
        deleted_at: null,
      },
      select: {
        id: true,
        patient_id: true,
        clinic_id: true,
        cid: true,
      },
      orderBy: { created_at: 'desc' },
    });

    const authorizedRecords = await this.fabricService.getRecordsByPatient(callerClinicId, patientId);
    const authorizedIds = new Set(authorizedRecords.map(r => r.recordId));

    const results: Array<{ recordId: string; content: any }> = [];

    for (const record of records) {
      if (!authorizedIds.has(record.id)) continue;

      try {
        const encryptedFile = await this.ipfsService.getFile(record.cid);
        const recordDEK = await this.keyManagementService.getRecordDEK(record.clinic_id, record.patient_id, record.id);
        const decryptedFile = this.encryptionService.decryptFile(encryptedFile, recordDEK);
        recordDEK.fill(0);

        const content = JSON.parse(decryptedFile.toString('utf-8'));
        results.push({ recordId: record.id, content });
      } catch (e) {
        console.warn(`Skipping record ${record.id}: not a JSON record (${e.message})`);
      }
    }

    return results;
  }

  public async getSOAPNotesForPatient(patientId: string, type?: RecordType): Promise<Array<{ recordId: string; content: any }>> {
    const records = await prisma.medicalRecord.findMany({
      where: {
        patient_id: patientId,
        mime_type: 'application/json',
        ...(type ? { type } : {}),
        deleted_at: null,
      },
      select: {
        id: true,
        patient_id: true,
        clinic_id: true,
        cid: true,
      },
      orderBy: { created_at: 'desc' },
    });

    const distinctClinicIds = [...new Set(records.map(r => r.clinic_id))];

    const authorizedIds = new Set<string>();
    for (const clinicId of distinctClinicIds) {
      const authorizedRecords = await this.fabricService.getRecordsByPatient(clinicId, patientId);
      authorizedRecords.forEach(r => authorizedIds.add(r.recordId));
    }

    const results: Array<{ recordId: string; content: any }> = [];

    for (const record of records) {
      if (!authorizedIds.has(record.id)) continue;

      try {
        const encryptedFile = await this.ipfsService.getFile(record.cid);
        const recordDEK = await this.keyManagementService.getRecordDEK(record.clinic_id, record.patient_id, record.id);
        const decryptedFile = this.encryptionService.decryptFile(encryptedFile, recordDEK);
        recordDEK.fill(0);

        const content = JSON.parse(decryptedFile.toString('utf-8'));
        results.push({ recordId: record.id, content });
      } catch (e) {
        console.warn(`Skipping record ${record.id}: not a JSON record (${e.message})`);
      }
    }

    return results;
  }

  public async getMedicalHistory(patientId: string): Promise<Array<{ recordId: string; content: any }>> {
    return this.getSOAPNotesForPatient(patientId, RecordType.MEDICAL_HISTORY);
  }

  public async addPatientMedicalHistory(patientId: string, dto: { name: string; content: Record<string, any> }): Promise<string> {
    const recordId = randomUUID();

    const contentBuffer = Buffer.from(JSON.stringify(dto.content), 'utf-8');
    const defaultClinicId = (await this.identityStorageService.defaultIdentity()).clinicId;
    const recordDEK = await this.keyManagementService.getRecordDEK(defaultClinicId, patientId, recordId);
    const encryptedFile = this.encryptionService.encryptFile(contentBuffer, recordDEK);
    recordDEK.fill(0);

    const cid = await this.ipfsService.uploadFile(encryptedFile, `${recordId}.enc`, 'application/octet-stream');

    await prisma.medicalRecord.create({
      data: {
        id: recordId,
        patient_id: patientId,
        clinic_id: defaultClinicId,
        name: dto.name,
        cid,
        type: RecordType.MEDICAL_HISTORY,
        mime_type: 'application/json',
      } as Prisma.MedicalRecordUncheckedCreateInput,
    });

    await this.fabricService.addRecord(defaultClinicId, {
      patientId,
      recordId,
      doctorId: patientId,
      type: RecordType.MEDICAL_HISTORY,
      ipfsCidKey: cid,
    });

    return recordId;
  }

  public async updatePatientMedicalHistory(
    patientId: string,
    recordId: string,
    dto: { name?: string; content?: Record<string, any> },
  ): Promise<void> {
    const record = await prisma.medicalRecord.findFirst({
      where: {
        id: recordId,
        patient_id: patientId,
        type: RecordType.MEDICAL_HISTORY,
        deleted_at: null,
      },
    });

    if (!record) {
      const error = createBilingualError(404, ErrorMessages.RECORD_NOT_FOUND);
      throw new HttpException(error.status, error.message, error.messageAr);
    }

    const oldCid = record.cid;

    if (dto.content !== undefined) {
      const contentBuffer = Buffer.from(JSON.stringify(dto.content), 'utf-8');
      const recordDEK = await this.keyManagementService.getRecordDEK(record.clinic_id, patientId, recordId);
      const encryptedFile = this.encryptionService.encryptFile(contentBuffer, recordDEK);
      recordDEK.fill(0);

      const newCid = await this.ipfsService.uploadFile(encryptedFile, `${recordId}.enc`, 'application/octet-stream');

      await prisma.medicalRecord.update({
        where: { id: recordId },
        data: {
          cid: newCid,
          ...(dto.name !== undefined ? { name: dto.name } : {}),
        },
      });

      try {
        await this.ipfsService.deleteFile(oldCid);
      } catch (e) {
        console.warn(`Old IPFS file cleanup skipped for ${recordId}: ${e.message}`);
      }
    } else if (dto.name !== undefined) {
      await prisma.medicalRecord.update({
        where: { id: recordId },
        data: { name: dto.name },
      });
    }
  }

  public async deletePatientMedicalHistory(patientId: string, recordId: string): Promise<void> {
    const record = await prisma.medicalRecord.findFirst({
      where: {
        id: recordId,
        patient_id: patientId,
        type: RecordType.MEDICAL_HISTORY,
        deleted_at: null,
      },
    });

    if (!record) {
      const error = createBilingualError(404, ErrorMessages.RECORD_NOT_FOUND);
      throw new HttpException(error.status, error.message, error.messageAr);
    }

    const defaultClinicId = (await this.identityStorageService.defaultIdentity()).clinicId;
    await this.fabricService.deleteRecord(defaultClinicId, patientId, recordId);

    await prisma.medicalRecord.update({
      where: { id: recordId },
      data: { deleted_at: new Date() },
    });
  }

  public async getVisitSummariesForDoctor(doctorId: string, patientId: string): Promise<Array<{ recordId: string; content: any }>> {
    return this.getJsonRecordsForDoctor(doctorId, patientId, RecordType.VISIT);
  }

  public async getMedicalHistoryForDoctor(doctorId: string, patientId: string): Promise<Array<{ recordId: string; content: any }>> {
    return this.getJsonRecordsForDoctor(doctorId, patientId, RecordType.MEDICAL_HISTORY);
  }

  private async getJsonRecordsForDoctor(doctorId: string, patientId: string, type: RecordType): Promise<Array<{ recordId: string; content: any }>> {
    const records = await prisma.medicalRecord.findMany({
      where: { patient_id: patientId, mime_type: 'application/json', type: type, deleted_at: null },
      select: { id: true, patient_id: true, clinic_id: true, cid: true },
      orderBy: { created_at: 'desc' },
    });

    const doctorClinics = await prisma.clinicDoctor.findMany({
      where: { doctor_id: doctorId },
      select: { clinic_id: true },
    });
    const doctorClinicIds = doctorClinics.map(c => c.clinic_id);

    const authorizedIds = new Set<string>();
    for (const clinicId of doctorClinicIds) {
      try {
        const authorized = await this.fabricService.getRecordsByPatient(clinicId, patientId);
        authorized.forEach(r => authorizedIds.add(r.recordId));
      } catch (e) {
        console.warn(`Chain check skipped for clinic ${clinicId}: ${e.message}`);
      }
    }

    const results: Array<{ recordId: string; content: any }> = [];
    for (const record of records) {
      if (!authorizedIds.has(record.id)) continue;
      try {
        const encryptedFile = await this.ipfsService.getFile(record.cid);
        const recordDEK = await this.keyManagementService.getRecordDEK(record.clinic_id, record.patient_id, record.id);
        const decryptedFile = this.encryptionService.decryptFile(encryptedFile, recordDEK);
        recordDEK.fill(0);
        results.push({ recordId: record.id, content: JSON.parse(decryptedFile.toString('utf-8')) });
      } catch (e) {
        console.warn(`Skipping record ${record.id}: ${e.message}`);
      }
    }
    return results;
  }

  public async deleteAllRecords(): Promise<{ deleted: number }> {
    const records = await prisma.medicalRecord.findMany({
      select: { id: true, patient_id: true, clinic_id: true, cid: true },
    });

    for (const record of records) {
      try {
        await this.fabricService.deleteRecord(record.clinic_id, record.patient_id, record.id);
      } catch (e) {
        console.warn(`Chain delete skipped for ${record.id}: ${e.message}`);
      }

      try {
        await this.ipfsService.deleteFile(record.cid);
      } catch (e) {
        console.warn(`IPFS delete skipped for ${record.id}: ${e.message}`);
      }

      await prisma.medicalRecord.delete({ where: { id: record.id } });
    }

    return { deleted: records.length };
  }
}
