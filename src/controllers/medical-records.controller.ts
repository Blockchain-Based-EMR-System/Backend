import { CreateDoctorRecordJsonDto, CreateMedicalRecordDto } from '@/dtos/medical-records.dto';
import { Request, Response } from 'express';
import { RequestWithUser } from '@/interfaces/auth.interface';
import { MedicalRecordService } from '@/services/medical-records.service';
import { catchAsync } from '@/utils/catchAsync';


export class MedicalRecordController {

    private medicalRecordService = new MedicalRecordService();


    public checkIpfsHealth = catchAsync(async (req: Request, res: Response): Promise<void> => {
        const result = await this.medicalRecordService.checkIpfsHealth();
        res.status(200).json(result);
    });

    public getRecordsMetadata = catchAsync(async (req: RequestWithUser, res: Response): Promise<void> => {
        const patientId = req.user.id;

        const records = await this.medicalRecordService.getPatientFiles(patientId);

        res.status(200).json({
            message: 'Medical records retrieved successfully',
            data: records,
        });
    });

    // this function adds json based data only
    public addRecord = catchAsync(async (req: RequestWithUser, res: Response): Promise<void> => {
        const clinicId = req.params.clinicId;
        const patientId = req.params.patientId;
        const doctorId = req.user.id;
        const dto: CreateDoctorRecordJsonDto = req.body;

        const recordId = await this.medicalRecordService.addDoctorRecord(
            clinicId,
            patientId,
            doctorId,
            dto,
        );

        res.status(201).json({
            message: 'Medical record created successfully',
            data: { recordId },
        });
    });

    public getSOAPNotes = catchAsync(async (req: RequestWithUser, res: Response): Promise<void> => {
        const patientId = req.user.id;

        const notes = await this.medicalRecordService.getSOAPNotesForPatient(patientId);

        res.status(200).json({
            message: 'SOAP notes retrieved successfully',
            data: notes,
        });
    });

    public grantAccess = catchAsync(async (req: RequestWithUser, res: Response): Promise<void> => {
        const patientId = req.user.id;
        const { targetClinicId } = req.body;

        await this.medicalRecordService.grantAccess(patientId, targetClinicId);

        res.status(200).json({
            message: 'Access granted successfully',
        });
    });
    // DEV ONLY — no auth
    public deleteAllRecords = catchAsync(async (_req: Request, res: Response): Promise<void> => {
        const result = await this.medicalRecordService.deleteAllRecords();
        res.status(200).json({
            message: `Deleted ${result.deleted} records from DB, IPFS, and blockchain`,
            data: result,
        });
    });
}

// to be added
/*

as getSOAPNotes gets json so we can use it for visit and history,
so it should accept these two types only 

another endpoint to add, get and delete file based records

add mock data if the blockchain netwrok is not available.
*/