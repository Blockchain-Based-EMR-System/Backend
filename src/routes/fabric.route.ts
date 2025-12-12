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
                        $label: 'org1',
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
            '/fabric/identities/:label',
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
                #swagger.parameters['X-Fabric-Identity'] = {
                    in: 'header',
                    description: 'Identity label (e.g., org1)',
                    required: true,
                    type: 'string'
                }
            */
            this.fabricController.initLedger,
        );

        // Medical Records Routes (require X-Fabric-Identity header)
        this.router.get(
            '/records',
            /* 
                #swagger.tags = ['MedicalRecords']
                #swagger.parameters['X-Fabric-Identity'] = {
                    in: 'header',
                    description: 'Identity label (e.g., org1)',
                    required: true,
                    type: 'string'
                }
            */
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
            /* 
                #swagger.tags = ['MedicalRecords']
                #swagger.parameters['X-Fabric-Identity'] = {
                    in: 'header',
                    description: 'Identity label (e.g., org1)',
                    required: true,
                    type: 'string'
                }
            */
            this.fabricController.getRecordById,
        );
        this.router.post(
            '/records',
            /* 
                #swagger.tags = ['MedicalRecords']
                #swagger.parameters['X-Fabric-Identity'] = {
                    in: 'header',
                    description: 'Identity label (e.g., org1)',
                    required: true,
                    type: 'string'
                }
                #swagger.parameters['body'] = {
                    in: 'body',
                    description: 'Medical record data',
                    required: true,
                    schema: {
                        $patientId: 'P12345',
                        $firstName: 'John',
                        $lastName: 'Doe',
                        $dateOfBirth: '1990-01-01',
                        $gender: 'Male',
                        $bloodType: 'O+',
                        $ipfsCid: 'Qm...',
                        summary: 'Optional summary'
                    }
                }
            */
            ValidationMiddleware(CreateMedicalRecordDto),
            this.fabricController.addRecord,
        );
        this.router.put(
            '/records/:patientId',
            /* 
                #swagger.tags = ['MedicalRecords']
                #swagger.parameters['X-Fabric-Identity'] = {
                    in: 'header',
                    description: 'Identity label (e.g., org1)',
                    required: true,
                    type: 'string'
                }
                #swagger.parameters['body'] = {
                    in: 'body',
                    description: 'Update medical record data',
                    required: true,
                    schema: {
                        $firstName: 'John',
                        $lastName: 'Doe',
                        $dateOfBirth: '1990-01-01',
                        $gender: 'Male',
                        $bloodType: 'O+',
                        $ipfsCid: 'Qm...',
                        summary: 'Optional summary'
                    }
                }
            */
            ValidationMiddleware(UpdateMedicalRecordDto),
            this.fabricController.updateRecord,
        );

        this.router.post(
            '/records/:patientId/access',
            /* 
                #swagger.tags = ['MedicalRecords']
                #swagger.parameters['X-Fabric-Identity'] = {
                    in: 'header',
                    description: 'Identity label (e.g., org1)',
                    required: true,
                    type: 'string'
                }
                #swagger.parameters['body'] = {
                    in: 'body',
                    description: 'Grant access to MSP',
                    required: true,
                    schema: {
                        $targetMsp: 'Org2MSP'
                    }
                }
            */
            this.fabricController.grantAccess,
        );
    }
}

