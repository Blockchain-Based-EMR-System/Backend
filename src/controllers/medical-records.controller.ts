import { CreateMedicalRecordDto } from '@/dtos/medical-records.dto';
import { Request, Response, NextFunction } from 'express';
import * as MedicalRecordService from '@/services/medical-records.service'
import { RequestWithUser } from '@/interfaces/auth.interface'; 
import { promises } from 'dns';


// upload a new medical record
export const uploadRecord = async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    try{
        if (!req.file){
        res.status(400).json({message: 'No file uploaded'});
        }

        const record_data: CreateMedicalRecordDto = req.body;
        const patient_id = req.user.id;
        const file_buffer = req.file.buffer;
        const file_name = req.file.originalname;

        const medical_record = await MedicalRecordService.createMedicalRecord(patient_id, record_data, file_buffer, file_name);

        res.status(201).json({
            message: 'uploaded MR successfully',
            data: medical_record,
        });
    }
    catch(e){
        next(e);
    }
};


// get all MRs for a patient

export const getPatientMedicalRecords = async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> =>{
    try{
        const patient_id = req.user.id;

        const records = await MedicalRecordService.getPatientRecords(patient_id);
        res.status(201).json({
            message: 'MRs retrieved successfully',
            data: records,
        });
    }
    catch(e){
        next(e);
    }
};


// get all MRs for a doctor
export const getDocrotMedicalRecords = async (req: RequestWithUser, res: Response, next:NextFunction): Promise<void> => {
    try{
        const doctor_id = req.user.id;

        const records = await MedicalRecordService.getDoctorRecords(doctor_id);
        res.status(201).json({
            message: 'MRs retrieved successfully',
            data: records,
        });
    }
    catch(e){
        next(e);
    }
};

export const deleteRecord = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const record_id = req.params.id;

    await MedicalRecordService.deleteRecord(record_id);

    res.status(200).json({
      message: 'deleted MR successfully',
    });
  } catch (e) {
    next(e);
  }
};