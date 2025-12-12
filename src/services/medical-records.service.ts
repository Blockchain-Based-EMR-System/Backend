import { PrismaClient } from '@prisma/client';
import { HttpException } from '@/exceptions/HttpException';
import { CreateMedicalRecordDto } from '@/dtos/medical-records.dto';
import { MedicalRecord } from '@/interfaces/medicalRecords.interface';
import prisma from '@/config/prisma';
import { Service } from 'typedi';
import { IpfsService } from '@/services/ipfs.service';

@Service()
export class MedicalRecordService {

    constructor(private ipfsService: IpfsService) { }

    // create a new  MR
    public async createMedicalRecord(
        patientId: string,
        fileData: CreateMedicalRecordDto,
        fileBuffer: Buffer,
        fileName: string,
    ): Promise<MedicalRecord> {
        // upload to IPFS and get cid
        const cid = await this.ipfsService.uploadFile(fileBuffer, fileName);
        console.log(`file is uploaded to ipfs, cid:" ${cid}`)

        // blockchain stuff

        // save to db
        const medicalRecord = await prisma.medicalRecord.create({
            data: {
                patient_id: patientId,
                doctor_id: fileData.doctor_id || null,
                name: fileData.name,
                cid: cid,
                type: fileData.type,
            },
            include: {
                patient: true,
            },
        });

        return medicalRecord;
    }

    // get all medical records for a specific patient

    public async getPatientRecords(patientId: string): Promise<MedicalRecord[]> {
        const records = await prisma.medicalRecord.findMany({
            where: {
                patient_id: patientId,
                deleted_at: null,
            },
            orderBy: {
                created_at: 'desc',
            },
            include: {
                patient: true,
            },
        });

        return records;
    }

    // get MR shared with a doctor 
    public async getDoctorRecords(doctorId: string): Promise<MedicalRecord[]> {
        const records = await prisma.medicalRecord.findMany({
            where: {
                doctor_id: doctorId,
                deleted_at: null,
            },
            orderBy: {
                created_at: 'desc',
            },
            include: {
                patient: true,
            },
        });

        return records;
    }

    // delete any MR (soft)
    public async deleteRecord(recordId: string) {
        // checking if it's already deleted
        const record = await prisma.medicalRecord.findFirst({
            where: {
                id: recordId,
                deleted_at: null,
            },
        });
        if (!record) {
            throw new HttpException(404, 'medical record not found or already deleted');
        }

        await prisma.medicalRecord.update({
            where: {
                id: recordId,
            },
            data: {
                deleted_at: new Date(),
            },
        });
    }
    // get a specific MR by id?? 
    // handle permissions --> fabric stuff 

}


















