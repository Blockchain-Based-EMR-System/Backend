import { NextFunction, Request, Response } from 'express';
import FabricService from '@/services/fabric.service';
import identityStorage from '@/services/identity-storage.service';
import { FabricIdentityInput } from '@/interfaces/fabric-identity.interface';
import { HttpException } from '@/exceptions/HttpException';

class FabricController {
    public fabricService = new FabricService();


    private getIdentityLabel(req: Request): string {
        const identityLabel = req.headers['x-fabric-identity'] as string;
        if (!identityLabel) {
            throw new HttpException(400, 'Missing X-Fabric-Identity header');
        }
        return identityLabel;
    }


    public onboardIdentity = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const input: FabricIdentityInput = req.body;
            
            // Validate required fields
            if (!input.label || !input.mspId || !input.certificate || 
                !input.privateKey || !input.peerEndpoint || !input.peerHostAlias || 
                !input.tlsCertificate) {
                throw new HttpException(400, 'Missing required fields: label, mspId, certificate, privateKey, peerEndpoint, peerHostAlias, tlsCertificate');
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
            const label = req.params.label;
            
            // Close any active connection for this identity
            await this.fabricService.closeConnection(label);
            
            // Delete from storage
            await identityStorage.deleteIdentity(label);
            
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
            const identityLabel = this.getIdentityLabel(req);
            const records = await this.fabricService.getAllRecords(identityLabel);
            res.status(200).json({ data: records, message: 'findAll' });
        } catch (error) {
            next(error);
        }
    };

    public getRecordById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const identityLabel = this.getIdentityLabel(req);
            const patientId = req.params.patientId;
            const record = await this.fabricService.getRecordByPatientId(identityLabel, patientId);
            res.status(200).json({ data: record, message: 'findOne' });
        } catch (error) {
            next(error);
        }
    };

    public addRecord = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const identityLabel = this.getIdentityLabel(req);
            await this.fabricService.addRecord(identityLabel, req.body);
            res.status(201).json({ message: 'created' });
        } catch (error) {
            next(error);
        }
    };

    public updateRecord = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const identityLabel = this.getIdentityLabel(req);
            const patientId = req.params.patientId;
            await this.fabricService.updateRecord(identityLabel, patientId, req.body);
            res.status(200).json({ message: 'updated' });
        } catch (error) {
            next(error);
        }
    };

    public grantAccess = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const identityLabel = this.getIdentityLabel(req);
            const patientId = req.params.patientId;
            const { targetMsp } = req.body;

            if (!targetMsp) {
                throw new HttpException(400, 'targetMsp is required');
            }

            await this.fabricService.grantAccess(identityLabel, patientId, targetMsp);
            res.status(200).json({ message: 'Access granted successfully' });
        } catch (error) {
            next(error);
        }
    };

    public initLedger = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const identityLabel = this.getIdentityLabel(req);
            await this.fabricService.initLedger(identityLabel);
            res.status(200).json({ message: 'Ledger initialized' });
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