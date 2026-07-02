import { CreateDoctorRecordJsonDto, CreateMedicalRecordDto, CreatePatientMedicalHistoryDto, UpdatePatientMedicalHistoryDto } from '@/dtos/medical-records.dto';
import { Request, Response } from 'express';
import { RequestWithUser } from '@/interfaces/auth.interface';
import { MedicalRecordService } from '@/services/medical-records.service';
import { catchAsync } from '@/utils/catchAsync';
import { RecordType } from '@/interfaces';

export class MedicalRecordController {

    private medicalRecordService = new MedicalRecordService();


    public getIpfsHealth = catchAsync(async (req: Request, res: Response): Promise<void> => {
        const result = await this.medicalRecordService.checkIpfsHealth();
        res.status(200).json(result);
    });

    public getPatientRecordsMetadata = catchAsync(async (req: RequestWithUser, res: Response): Promise<void> => {
        const patientId = req.user.id;

        const records = await this.medicalRecordService.getPatientFiles(patientId);

        res.status(200).json({
            message: 'Medical records retrieved successfully',
            data: records,
        });
    });

    public createDoctorRecord = catchAsync(async (req: RequestWithUser, res: Response): Promise<void> => {
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

    public createPatientMedicalHistory = catchAsync(async (req: RequestWithUser, res: Response): Promise<void> => {
        const patientId = req.user.id;
        const dto: CreatePatientMedicalHistoryDto = req.body;

        const recordId = await this.medicalRecordService.addPatientMedicalHistory(patientId, dto);

        res.status(201).json({
            message: 'Medical history entry created successfully',
            data: { recordId },
        });
    });

    public updatePatientMedicalHistory = catchAsync(async (req: RequestWithUser, res: Response): Promise<void> => {
        const patientId = req.user.id;
        const recordId = req.params.recordId;
        const dto: UpdatePatientMedicalHistoryDto = req.body;

        await this.medicalRecordService.updatePatientMedicalHistory(patientId, recordId, dto);

        res.status(200).json({
            message: 'Medical history entry updated successfully',
        });
    });

    public deletePatientMedicalHistory = catchAsync(async (req: RequestWithUser, res: Response): Promise<void> => {
        const patientId = req.user.id;
        const recordId = req.params.recordId;

        await this.medicalRecordService.deletePatientMedicalHistory(patientId, recordId);

        res.status(200).json({
            message: 'Medical history entry deleted successfully',
        });
    });

    public getPatientVisitSummaries = catchAsync(async (req: RequestWithUser, res: Response): Promise<void> => {
        const patientId = req.user.id;

        const notes = await this.medicalRecordService.getSOAPNotesForPatient(patientId, RecordType.VISIT_SUMMARY);

        res.status(200).json({
            message: 'Visit summaries retrieved successfully',
            data: notes,
        });
    });

    public getPatientMedicalHistory = catchAsync(async (req: RequestWithUser, res: Response): Promise<void> => {
        const patientId = req.user.id;

        const history = await this.medicalRecordService.getMedicalHistory(patientId);

        res.status(200).json({
            message: 'Medical history retrieved successfully',
            data: history,
        });
    });

    public getDoctorPatientVisitSummaries = catchAsync(async (req: RequestWithUser, res: Response): Promise<void> => {
        const doctorId = req.user.id;
        const patientId = req.params.patientId;

        const notes = await this.medicalRecordService.getVisitSummariesForDoctor(doctorId, patientId);

        res.status(200).json({
            message: 'Visit summaries retrieved successfully',
            data: notes,
        });
    });

    public getDoctorPatientMedicalHistory = catchAsync(async (req: RequestWithUser, res: Response): Promise<void> => {
        const doctorId = req.user.id;
        const patientId = req.params.patientId;

        const history = await this.medicalRecordService.getMedicalHistoryForDoctor(doctorId, patientId);

        res.status(200).json({
            message: 'Medical history retrieved successfully',
            data: history,
        });
    });

    public grantPatientAccess = catchAsync(async (req: RequestWithUser, res: Response): Promise<void> => {
        const patientId = req.user.id;
        const { targetClinicId } = req.body;

        await this.medicalRecordService.grantAccess(patientId, targetClinicId);

        res.status(200).json({
            message: 'Access granted successfully',
        });
    });

    public deleteAllRecords = catchAsync(async (_req: Request, res: Response): Promise<void> => {
        const result = await this.medicalRecordService.deleteAllRecords();
        res.status(200).json({
            message: `Deleted ${result.deleted} records from DB, IPFS, and blockchain`,
            data: result,
        });
    });
}
