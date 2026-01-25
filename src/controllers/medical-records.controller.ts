import { CreateMedicalRecordDto } from '@/dtos/medical-records.dto';
import { Request, Response, NextFunction } from 'express';
import { RequestWithUser } from '@/interfaces/auth.interface';
import { promises } from 'dns';
import { MedicalRecordService } from '@/services/medical-records.service';
import { catchAsync } from '@/utils/catchAsync';


export class MedicalRecordController {

    constructor(private medicalRecordService: MedicalRecordService) { }

    // upload a new medical record
    public uploadRecord = catchAsync(async (req: RequestWithUser, res: Response): Promise<void> => {
        if (!req.file) {
            res.status(400).json({ message: 'No file uploaded' });
        }

        const recordData: CreateMedicalRecordDto = req.body;
        const patientId = req.user.id;
        const fileBuffer = req.file.buffer;
        const fileName = req.file.originalname;

        const medical_record = await this.medicalRecordService.createMedicalRecord(patientId, recordData, fileBuffer, fileName);

        res.status(201).json({
            message: 'uploaded MR successfully',
            data: medical_record,
        });
    });

    // get all MRs for a patient
    public getPatientMedicalRecords = catchAsync(async (req: RequestWithUser, res: Response): Promise<void> => {
        const patientId = req.user.id;

        const records = await this.medicalRecordService.getPatientRecords(patientId);
        res.status(201).json({
            message: 'MRs retrieved successfully',
            data: records,
        });
    });

    // get all MRs for a doctor
    public getDocrotMedicalRecords = catchAsync(async (req: RequestWithUser, res: Response): Promise<void> => {
        const doctorId = req.user.id;

        const records = await this.medicalRecordService.getDoctorRecords(doctorId);
        res.status(201).json({
            message: 'MRs retrieved successfully',
            data: records,
        });
    });


    public deleteRecord = catchAsync(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const record_id = req.params.id;

        await this.medicalRecordService.deleteRecord(record_id);

        res.status(200).json({
            message: 'deleted MR successfully',
        });
    });

}









