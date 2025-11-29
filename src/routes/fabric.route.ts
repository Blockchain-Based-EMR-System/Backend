import { Router } from 'express';
import FabricContoller from '@/controllers/fabric.controller';
import { Routes } from '@interfaces/routes.interface';

export class FabricRoute implements Routes {
    public path = '/assets';
    public router = Router();
    public fabricController = new FabricContoller();

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.get(
            '/assets',
            /* #swagger.tags = ['fabric'] */
            this.fabricController.getAllAssets,
        );
        // Place the explicit health route before the dynamic `:id` route so the literal
        // path `/assets/health` is matched first instead of being captured as `:id = 'health'.
        this.router.get(
            '/assets/health',
            /* #swagger.tags = ['fabric'] */
            this.fabricController.checkHealth,
        );
        this.router.get(
            '/assets/:id',
            /* #swagger.tags = ['fabric'] */
            this.fabricController.getAssetById,
        );
        this.router.post(
            '/assets',
            /* #swagger.tags = ['fabric'] */
            this.fabricController.createAsset,
        );
        this.router.put(
            '/assets/:id/transfer',
            /* #swagger.tags = ['fabric'] */
            this.fabricController.transferAsset,
        );
    }
}

