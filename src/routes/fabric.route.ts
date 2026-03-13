import { Router } from 'express';
import FabricContoller from '@/controllers/fabric.controller';
import { CreateMedicalRecordDto, UpdateMedicalRecordDto } from '@/dtos/medicalRecord.dto';
import { OnboardIdentityDto } from '@/dtos/fabric-identity.dto';
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
        // Identity Management Routes
        this.router.post(
            '/fabric/onboard',
            /* 
                #swagger.tags = ['FabricIdentity']
                #swagger.parameters['body'] = {
                    in: 'body',
                    description: 'Identity onboarding data',
                    required: true,
                    schema: {
                        $clinicId: 'clinic-uuid-here',
                        $mspId: 'Org1MSP',
                        $certificate: 'PEM certificate',
                        $privateKey: 'PEM private key',
                        $peerEndpoint: 'localhost:7051',
                        $peerHostAlias: 'peer0.org1.example.com',
                        $tlsCertificate: 'PEM TLS certificate',
                        channelName: 'mychannel',
                        chaincodeName: 'test'
                    }
                }
            */
            ValidationMiddleware(OnboardIdentityDto),
            this.fabricController.onboardIdentity,
        );
        this.router.get(
            '/fabric/identities',
            /* #swagger.tags = ['FabricIdentity'] */
            this.fabricController.listIdentities,
        );
        this.router.delete(
            '/fabric/identities/:clinicId',
            /* #swagger.tags = ['FabricIdentity'] */
            this.fabricController.deleteIdentity,
        );
        this.router.get(
            '/fabric/connections',
            /* #swagger.tags = ['FabricIdentity'] */
            this.fabricController.getConnectionStats,
        );
        this.router.post(
            '/fabric/init-ledger',
            /*
                #swagger.tags = ['FabricIdentity']
                #swagger.description = 'Initialize the ledger, optionally seeding it with backup records'
                #swagger.parameters['body'] = {
                    in: 'body',
                    description: 'Optional backup data to seed the ledger',
                    required: false,
                    schema: {
                        backupData: [
                            {
                                patientId: 'patient-uuid',
                                recordId: 'record-uuid',
                                doctorId: 'doctor-uuid',
                                type: 'LAB_RESULT',
                                ownerMsp: 'Org1MSP',
                                authorizedMsps: []
                            }
                        ]
                    }
                }
            */
            this.fabricController.initLedger,
        );
        this.router.get(
            '/records/health',
            /* #swagger.tags = ['MedicalRecords'] */
            this.fabricController.checkHealth,
        );
    }
}

