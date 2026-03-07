import { NextFunction, Request, Response } from 'express';
import FabricService from '@/services/fabric.service';
import identityStorage from '@/services/identity-storage.service';
import { FabricIdentityInput } from '@/interfaces/fabric-identity.interface';
import { HttpException } from '@/exceptions/HttpException';

class FabricController {
    public fabricService = new FabricService();


    public onboardIdentity = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const input: FabricIdentityInput = req.body;
            
            // Validate required fields
            if (!input.clinicId || !input.mspId || !input.certificate || 
                !input.privateKey || !input.peerEndpoint || !input.peerHostAlias || 
                !input.tlsCertificate) {
                throw new HttpException(400, 'Missing required fields: clinicId, mspId, certificate, privateKey, peerEndpoint, peerHostAlias, tlsCertificate');
            }

            const identity = await identityStorage.storeIdentity(input);
            res.status(201).json({ 
                data: identity, 
                message: 'Identity onboarded successfully' 
            });
        } catch (error) {
            next(error);
        }
    };


    public listIdentities = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const identities = await identityStorage.listIdentities();
            res.status(200).json({ data: identities, message: 'listIdentities' });
        } catch (error) {
            next(error);
        }
    };


    public deleteIdentity = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const clinicId = req.params.clinicId;
            await this.fabricService.closeConnection(clinicId);
            await identityStorage.deleteIdentity(clinicId);
            res.status(200).json({ message: 'Identity deleted successfully' });
        } catch (error) {
            next(error);
        }
    };

    public getConnectionStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const stats = this.fabricService.getConnectionStats();
            res.status(200).json({ data: stats, message: 'connectionStats' });
        } catch (error) {
            next(error);
        }
    };

    public getAllRecords = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const clinicId = req.params.clinicId;
            const records = await this.fabricService.getAllRecords(clinicId);
            res.status(200).json({ data: records, message: 'findAll' });
        } catch (error) {
            next(error);
        }
    };

    public getRecordsByPatient = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const clinicId = req.params.clinicId;
            const patientId = req.params.patientId;
            const records = await this.fabricService.getRecordsByPatient(clinicId, patientId);
            res.status(200).json({ data: records, message: 'findAll' });
        } catch (error) {
            next(error);
        }
    };

    public addRecord = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const clinicId = req.params.clinicId;
            await this.fabricService.addRecord(clinicId, req.body);
            res.status(201).json({ message: 'created' });
        } catch (error) {
            next(error);
        }
    };

    public updateRecord = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const clinicId = req.params.clinicId;
            const patientId = req.params.patientId;
            await this.fabricService.updateRecord(clinicId, patientId, req.body);
            res.status(200).json({ message: 'updated' });
        } catch (error) {
            next(error);
        }
    };

    public grantAccess = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const clinicId = req.params.clinicId;
            const patientId = req.params.patientId;
            const { targetMsp } = req.body;

            if (!targetMsp) {
                throw new HttpException(400, 'targetMsp is required');
            }

            await this.fabricService.grantAccess(clinicId, patientId, targetMsp);
            res.status(200).json({ message: 'Access granted successfully' });
        } catch (error) {
            next(error);
        }
    };

    public initLedger = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const clinicId = req.params.clinicId;
            const backupData = Array.isArray(req.body?.backupData) ? req.body.backupData : [];
            await this.fabricService.initLedger(clinicId, backupData);
            res.status(200).json({ message: 'Ledger initialized', seeded: backupData.length });
        } catch (error) {
            next(error);
        }
    };

    public checkHealth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const stats = this.fabricService.getConnectionStats();
            res.status(200).json({ 
                status: 'OK', 
                message: 'Fabric service is healthy',
                activeConnections: stats.total
            });
        } catch (error) {
            next(error);
        }
    };
}

export default FabricController;