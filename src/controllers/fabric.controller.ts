import { NextFunction, Request, Response } from 'express';
import FabricService from '@/services/fabric.service';

class FabricController {
    public fabricService = new FabricService();

    public getAllRecords = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const records = await this.fabricService.getAllRecords();
            res.status(200).json({ data: records, message: 'findAll' });
        } catch (error) {
            next(error);
        }
    };

    public getRecordById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const patientId = req.params.patientId;
            const record = await this.fabricService.getRecordByPatientId(patientId);
            res.status(200).json({ data: record, message: 'findOne' });
        } catch (error) {
            next(error);
        }
    };

    public addRecord = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            await this.fabricService.addRecord(req.body);
            res.status(201).json({ message: 'created' });
        } catch (error) {
            next(error);
        }
    };

    public updateRecord = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const patientId = req.params.patientId;
            await this.fabricService.updateRecord(patientId, req.body);
            res.status(200).json({ message: 'updated' });
        } catch (error) {
            next(error);
        }
    };
    public checkHealth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            // Simple health check logic
            res.status(200).json({ status: 'OK', message: 'Fabric service is healthy' });
        } catch (error) {
            next(error);
        }
    };
}

export default FabricController;