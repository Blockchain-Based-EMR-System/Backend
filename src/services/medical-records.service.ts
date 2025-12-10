import { PrismaClient } from '@prisma/client';
import { HttpException } from '@/exceptions/HttpException';
import { CreateMedicalRecordDto } from '@/dtos/medical-records.dto';
import { uploadFile, getFile } from '@/services/ipfs.service';
import { MedicalRecord } from '@/interfaces/medicalRecords.interface';
import prisma from '@/config/prisma';

// create a new  MR
export const createMedicalRecord = async (
    patient_id: string,
    fileData: CreateMedicalRecordDto,
    fileBuffer: Buffer,
    fileName: string,
): Promise<MedicalRecord> => {
    try {
        // upload to IPFS and get cid
        const cid = await uploadFile(fileBuffer, fileName);
        console.log(`file is uploaded to ipfs, cid:" ${cid}`)

        // blockchain stuff

        // save to db
        const medicalRecord = await prisma.medicalRecord.create({
            data: {
                patient_id: patient_id,
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
    catch (e) {
        console.error('error creating medical record:', e);
        throw new HttpException(500, 'failed to create medical record');
    }
}


// get all medical records for a specific patient

export const getPatientRecords = async (patient_id: string): Promise<MedicalRecord[]> => {
    try {
        const records = await prisma.medicalRecord.findMany({
            where: {
                patient_id: patient_id,
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
    catch (e) {
        console.error('error fetching patient records:', e);
        throw new HttpException(500, 'failed to fetch patient records');
    }
};

// get MR shared with a doctor 
export const getDoctorRecords = async (doctor_id: string): Promise<MedicalRecord[]> => {
    try {
        const records = await prisma.medicalRecord.findMany({
            where: {
                doctor_id: doctor_id,
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
    catch (e) {
        console.error('error fetching doctor records:', e);
        throw new HttpException(500, 'failed to fetch doctor records');
    }
}

// delete any MR (soft)
export const deleteRecord = async (record_id: string) => {
    try {
        // checking if it's already deleted
        const record = await prisma.medicalRecord.findFirst({
            where: {
                id: record_id,
                deleted_at: null,
            },
        });
        if (!record) {
            throw new HttpException(404, 'medical record not found or already deleted');
        }

        await prisma.medicalRecord.update({
            where: {
                id: record_id,
            },
            data: {
                deleted_at: new Date(),
            },
        });
    }
    catch (e) {
        console.error('Error deleting medical record:', e);
        throw new HttpException(500, 'failed to delete medical record');
    }
}
// get a specific MR by id?? 
// handle permissions --> fabric stuff 