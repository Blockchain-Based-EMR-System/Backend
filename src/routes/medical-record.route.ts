import { Routes } from '@/interfaces';
import { ValidationMiddleware } from '@/middlewares/validation.middleware';
import { Router } from 'express';
import { MedicalRecordController } from '@/controllers/medical-records.controller';
import { AuthMiddleware, RoleMiddleware } from '@/middlewares/auth.middleware';
import { Role } from '@prisma/client';
import { CreateDoctorRecordJsonDto, CreateMedicalRecordDto } from '@/dtos/medical-records.dto';
import { uploadSingleFile } from '@/middlewares/upload.middleware';

export class MedicalRecordRoute implements Routes {
  public path = '/record';
  public router = Router();
  public medicalRecordController = new MedicalRecordController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get(
      `${this.path}/health/ipfs`,
      /*
                #swagger.path = '/record/health/ipfs'
                #swagger.method = 'get'
                #swagger.tags = ['Medical Records']
                #swagger.description = 'Checks connectivity to the IPFS (Pinata) service'
                #swagger.responses[200] = {
                    description: 'IPFS connection is healthy',
                    schema: { status: 'ok', message: 'IPFS connection is healthy' }
                }
                #swagger.responses[503] = {
                    description: 'IPFS service is unreachable'
                }
            */
      this.medicalRecordController.checkIpfsHealth,
    );

    this.router.get(
      `${this.path}/patient/metadata`,
      /*
                #swagger.path = '/record/patient'
                #swagger.method = 'get'
                #swagger.tags = ['Medical Records']
                #swagger.description = 'Retrieves all medical record metadata for the authenticated patient (no file bytes)'

                #swagger.parameters['Authorization'] = {
                    in: 'cookie',
                    description: 'Bearer token for authentication',
                    required: true,
                    type: 'string'
                }

                #swagger.responses[200] = {
                    description: 'Medical records retrieved successfully',
                    schema: {
                        message: 'Medical records retrieved successfully',
                        data: [
                            {
                                id: 'uuid-string',
                                patient_id: 'uuid-string',
                                clinic_id: 'uuid-string',
                                doctor_id: 'uuid-string',
                                appointment_id: 'uuid-string',
                                name: 'Blood Test Results',
                                type: 'LAB_RESULT',
                                mime_type: 'application/pdf',
                                cid: 'bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi'
                            }
                        ]
                    }
                }
                #swagger.responses[401] = {
                    description: 'Unauthorized – missing or invalid token'
                }
            */
      AuthMiddleware,
      RoleMiddleware(Role.PATIENT),
      this.medicalRecordController.getRecordsMetadata,
    );

    this.router.post(
      `${this.path}/:clinicId/:patientId/soap-note`,
      /*
                #swagger.path = '/record/{clinicId}/{patientId}/soap-note'
                #swagger.method = 'post'
                #swagger.tags = ['Medical Records']
                #swagger.description = 'Doctor creates a JSON-based medical record for a patient. Validates the doctor works at the clinic. Content is encrypted and stored on IPFS.'

                #swagger.parameters['Authorization'] = {
                    in: 'cookie',
                    description: 'Bearer token for authentication',
                    required: true,
                    type: 'string'
                }

                #swagger.parameters['clinicId'] = {
                    in: 'path',
                    description: 'UUID of the clinic',
                    required: true,
                    type: 'string'
                }

                #swagger.parameters['patientId'] = {
                    in: 'path',
                    description: 'UUID of the patient',
                    required: true,
                    type: 'string'
                }

                #swagger.parameters['body'] = {
                    in: 'body',
                    description: 'Medical record payload',
                    required: true,
                    schema: {
                        name: 'SOAP Note 2026-03-08',
                        type: 'SOAP_NOTE',
                        content: {
                            subjective: 'Patient reports headache',
                            objective: 'BP 120/80',
                            assessment: 'Tension headache',
                            plan: 'Ibuprofen 400mg'
                        }
                    }
                }

                #swagger.responses[201] = {
                    description: 'Medical record created successfully',
                    schema: { message: 'Medical record created successfully', data: { recordId: 'uuid-string' } }
                }
                #swagger.responses[400] = {
                    description: 'Validation failed'
                }
                #swagger.responses[403] = {
                    description: 'Doctor is not associated with this clinic'
                }
            */
      AuthMiddleware,
      RoleMiddleware(Role.DOCTOR),
      ValidationMiddleware(CreateDoctorRecordJsonDto),
      this.medicalRecordController.addRecord,
    );

    this.router.get(
      `${this.path}/patient/soap-notes`,
      /*
                #swagger.path = '/record/patient/soap-notes'
                #swagger.method = 'get'
                #swagger.tags = ['Medical Records']
                #swagger.description = 'Patient retrieves all their own SOAP notes, authorized across all clinics on-chain.'

                #swagger.parameters['Authorization'] = {
                    in: 'cookie',
                    description: 'Bearer token for authentication',
                    required: true,
                    type: 'string'
                }

                #swagger.responses[200] = {
                    description: 'SOAP notes retrieved successfully',
                    schema: {
                        message: 'SOAP notes retrieved successfully',
                        data: [{ recordId: 'uuid-string', content: {} }]
                    }
                }
                #swagger.responses[401] = {
                    description: 'Unauthorized – missing or invalid token'
                }
            */
      AuthMiddleware,
      RoleMiddleware(Role.PATIENT),
      this.medicalRecordController.getSOAPNotes,
    );

    this.router.post(
      `${this.path}/grant-access`,
      /*
                #swagger.path = '/record/grant-access'
                #swagger.method = 'post'
                #swagger.tags = ['Medical Records']
                #swagger.description = 'Patient grants a target clinic access to ALL their medical records across all owner clinics.'

                #swagger.parameters['Authorization'] = {
                    in: 'cookie',
                    description: 'Bearer token for authentication',
                    required: true,
                    type: 'string'
                }

                #swagger.parameters['body'] = {
                    in: 'body',
                    required: true,
                    schema: { targetClinicId: 'uuid-string' }
                }

                #swagger.responses[200] = {
                    description: 'Access granted successfully',
                    schema: { message: 'Access granted successfully' }
                }
                #swagger.responses[401] = {
                    description: 'Unauthorized – missing or invalid token'
                }
            */
      AuthMiddleware,
      RoleMiddleware(Role.PATIENT),
      this.medicalRecordController.grantAccess,
    );

    this.router.delete(
      `${this.path}/dev/all`,
      /*
                #swagger.path = '/record/dev/all'
                #swagger.method = 'delete'
                #swagger.tags = ['Medical Records']
                #swagger.description = 'DEV ONLY — hard-deletes every medical record from DB, IPFS, and blockchain. No authentication required.'
                #swagger.responses[200] = {
                    description: 'All records deleted',
                    schema: { message: 'Deleted 5 records from DB, IPFS, and blockchain', data: { deleted: 5 } }
                }
            */
      this.medicalRecordController.deleteAllRecords,
    );
  }
}
