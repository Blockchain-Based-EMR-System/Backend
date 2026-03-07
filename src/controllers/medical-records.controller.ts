import { CreateMedicalRecordDto } from '@/dtos/medical-records.dto';
import { Request, Response } from 'express';
import { RequestWithUser } from '@/interfaces/auth.interface';
import { MedicalRecordService } from '@/services/medical-records.service';
import { catchAsync } from '@/utils/catchAsync';


export class MedicalRecordController {

    private medicalRecordService = new MedicalRecordService();

    public uploadRecord = catchAsync(async (req: RequestWithUser, res: Response): Promise<void> => {
        if (!req.file) {
            res.status(400).json({ message: 'No file uploaded' });
            return;
        }

        const recordData: CreateMedicalRecordDto = req.body;
        const patientId = req.user.id;
        const doctorId = req.params.doctorId;
        const clinicId = req.params.clinicId;
        const fileBuffer = req.file.buffer;
        const fileName = req.file.originalname;
        const mimeType = req.file.mimetype;

        await this.medicalRecordService.createMedicalRecord(
            clinicId,
            patientId,
            doctorId,
            recordData,
            fileBuffer,
            fileName,
            mimeType,
        );

        res.status(201).json({
            message: 'Medical record uploaded successfully',
        });
    });

    public getPatientMedicalRecords = catchAsync(async (req: RequestWithUser, res: Response): Promise<void> => {
        const patientId = req.user.id;

        const records = await this.medicalRecordService.getPatientFiles(patientId);

        res.status(200).json({
            message: 'Medical records retrieved successfully',
            data: records,
        });
    });


    public getRecordFile = catchAsync(async (req: RequestWithUser, res: Response): Promise<void> => {
        const recordId = req.params.id;
        const clinicId = req.params.clinicId;

        const { buffer, ...metadata } = await this.medicalRecordService.getRecordFile(clinicId, recordId);

        res.status(200).json({
            message: 'Medical record retrieved successfully',
            data: {
                ...metadata,
                file: buffer.toString('base64'),
            },
        });
    });

    public checkIpfsHealth = catchAsync(async (req: Request, res: Response): Promise<void> => {
        const result = await this.medicalRecordService.checkIpfsHealth();
        res.status(200).json(result);
    });

    public deleteRecord = catchAsync(async (req: RequestWithUser, res: Response): Promise<void> => {
        const recordId = req.params.id;
        const clinicId = req.params.clinicId;

        await this.medicalRecordService.deleteRecord(clinicId, recordId);

        res.status(200).json({
            message: 'Medical record deleted successfully',
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

    public addDoctorRecord = catchAsync(async (req: RequestWithUser, res: Response): Promise<void> => {
        if (!req.file) {
            res.status(400).json({ message: 'No file uploaded' });
            return;
        }

        const clinicId = req.params.clinicId;
        const patientId = req.params.patientId;
        const doctorId = req.user.id;
        const recordData: CreateMedicalRecordDto = req.body;
        const fileBuffer = req.file.buffer;
        const fileName = req.file.originalname;
        const mimeType = req.file.mimetype;

        const recordId = await this.medicalRecordService.addDoctorRecord(
            clinicId,
            patientId,
            doctorId,
            recordData,
            fileBuffer,
            fileName,
            mimeType,
        );

        res.status(201).json({
            message: 'Medical record uploaded successfully',
            data: { recordId },
        });
    });

    public getSOAPNotes = catchAsync(async (req: RequestWithUser, res: Response): Promise<void> => {
        const clinicId = req.params.clinicId;
        const patientId = req.params.patientId;

        const notes = await this.medicalRecordService.getSOAPNotes(clinicId, patientId);

        res.status(200).json({
            message: 'SOAP notes retrieved successfully',
            data: notes,
        });
    });

    // // metadata only
    // public getRecordMetadata = catchAsync(async (req: Request, res: Response): Promise<void> => {
    //     const record = await this.medicalRecordService.getRecordMetadata(req.params.id);
    //     res.status(200).json({
    //         message: 'Medical record retrieved successfully',
    //         data: record,
    //     });
    // });

    // // raw file stream
    // public getRecordFile = catchAsync(async (req: Request, res: Response): Promise<void> => {
    //     const record = await this.medicalRecordService.getRecordFile(req.params.id);
    //     res.setHeader('Content-Type', record.mime_type);
    //     res.setHeader('Content-Disposition', `inline; filename="${record.name}"`);
    //     res.status(200).send(record.buffer);
    // });
}