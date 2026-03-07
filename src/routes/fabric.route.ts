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
                #swagger.description = 'Get all records for a patient (authorized MSPs only)'
            */
            this.fabricController.getRecordsByPatient,
        );
        this.router.post(
            '/records',
            /*
                #swagger.tags = ['MedicalRecords']
                #swagger.description = 'Add a new medical record for a patient'
                #swagger.parameters['body'] = {
                    in: 'body',
                    required: true,
                    schema: {
                        $patientId: 'patient-uuid',
                        $recordId: 'record-uuid',
                        $doctorId: 'doctor-uuid',
                        $type: 'LAB_RESULT',
                        $ipfsCidKey: 'bafybeigdyrzt...'
                    }
                }
            */
            ValidationMiddleware(CreateMedicalRecordDto),
            this.fabricController.addRecord,
        );
        this.router.put(
            '/records/:patientId/:recordId',
            /*
                #swagger.tags = ['MedicalRecords']
                #swagger.description = 'Update an existing medical record (doctorId, type, optional new ipfsCidKey via transient)'
                #swagger.parameters['body'] = {
                    in: 'body',
                    required: true,
                    schema: {
                        $recordId: 'uuid-record-id',
                        $doctorId: 'doctor-uuid',
                        $type: 'LAB_RESULT',
                        ipfsCidKey: 'optional-new-cid-key'
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
                #swagger.description = 'Grant access to all records of a patient for a target MSP'
                #swagger.parameters['body'] = {
                    in: 'body',
                    required: true,
                    schema: { $targetMsp: 'Org2MSP' }
                }
            */
                }
            */
            this.fabricController.grantAccess,
        );
    }
}

