import { Router } from 'express';
import FabricContoller from '@/controllers/fabric.controller';
import { CreateMedicalRecordDto, UpdateMedicalRecordDto } from '@/dtos/medicalRecord.dto';
import { ValidationMiddleware } from '@middlewares/validation.middleware';
import { Routes } from '@interfaces/routes.interface';

export class FabricRoute implements Routes {
    public path = '/records';
    public router = Router();
    public fabricController = new FabricContoller();

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.get(
            '/records',
            /* #swagger.tags = ['MedicalRecords'] */
            this.fabricController.getAllRecords,
        );
        // Place the explicit health route before the dynamic `:patientId` route so the literal
        // path `/records/health` is matched first instead of being captured as `:patientId = 'health'.
        this.router.get(
            '/records/health',
            /* #swagger.tags = ['MedicalRecords'] */
            this.fabricController.checkHealth,
        );
        this.router.get(
            '/records/:patientId',
            /* #swagger.tags = ['MedicalRecords'] */
            this.fabricController.getRecordById,
        );
        this.router.post(
            '/records',
            /* #swagger.tags = ['MedicalRecords'] */
            ValidationMiddleware(CreateMedicalRecordDto),
            this.fabricController.addRecord,
        );
        this.router.put(
            '/records/:patientId',
            /* #swagger.tags = ['MedicalRecords'] */
            ValidationMiddleware(UpdateMedicalRecordDto),
            this.fabricController.updateRecord,
        );
    }
}

