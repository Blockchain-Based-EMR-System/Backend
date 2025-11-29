import { NextFunction, Request, Response } from 'express';
import FabricService from '@/services/fabric.service';

class FabricController {
    public fabricService = new FabricService();

    public getAllAssets = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const assets = await this.fabricService.getAllAssets();
            res.status(200).json({ data: assets, message: 'findAll' });
        } catch (error) {
            next(error);
        }
    };

    public getAssetById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const assetId = req.params.id;
            const asset = await this.fabricService.readAssetByID(assetId);
            res.status(200).json({ data: asset, message: 'findOne' });
        } catch (error) {
            next(error);
        }
    };

    public createAsset = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { id, color, size, owner, appraisedValue } = req.body;
            await this.fabricService.createAsset(id, color, size, owner, appraisedValue);
            res.status(201).json({ message: 'created' });
        } catch (error) {
            next(error);
        }
    };

    public transferAsset = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const assetId = req.params.id;
            const { newOwner } = req.body;
            const oldOwner = await this.fabricService.transferAsset(assetId, newOwner);
            res.status(200).json({ message: `transferred from ${oldOwner} to ${newOwner}` });
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