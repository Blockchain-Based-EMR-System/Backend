import { Routes } from '@/interfaces';
import { ValidationMiddleware } from '@/middlewares/validation.middleware';
import { Router } from 'express';
import { MedicalRecordController } from '@/controllers/medical-records.controller';
import { AuthMiddleware, RoleMiddleware } from '@/middlewares/auth.middleware';
import { Role } from '@prisma/client';
import {
  CreateDoctorRecordJsonDto,
  CreateMedicalRecordDto,
  CreatePatientMedicalHistoryDto,
  UpdatePatientMedicalHistoryDto,
} from '@/dtos/medical-records.dto';
import { uploadSingleFile } from '@/middlewares/upload.middleware';

export class MedicalRecordRoute implements Routes {
  public path = '/medical-records';
  public router = Router();
  public medicalRecordController = new MedicalRecordController();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get(
      `${this.path}/health/ipfs`,
      /*
                #swagger.path = '/medical-records/health/ipfs'
                #swagger.method = 'get'
                #swagger.tags = ['Medical Records - Public']
                #swagger.description = 'Checks connectivity to the IPFS (Pinata) service'
                #swagger.responses[200] = {
                    description: 'IPFS connection is healthy',
                    schema: { status: 'ok', message: 'IPFS connection is healthy' }
                }
                #swagger.responses[503] = {
                    description: 'IPFS service is unreachable'
                }
            */
      this.medicalRecordController.getIpfsHealth,
    );

    this.router.post(
      `${this.path}/clinics/:clinicId/patients/:patientId/visit-summaries`,
      /*
                #swagger.path = '/medical-records/clinics/{clinicId}/patients/{patientId}/visit-summaries'
                #swagger.method = 'post'
                #swagger.tags = ['Medical Records - Doctor']
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
      this.medicalRecordController.createDoctorRecord,
    );

    this.router.get(
      `${this.path}/patient/visit-summaries`,
      /*
                #swagger.path = '/medical-records/patient/visit-summaries'
                #swagger.method = 'get'
                #swagger.tags = ['Medical Records - Patient']
                #swagger.description = 'Patient retrieves all their VISIT_SUMMARY records, decrypted and authorized across all clinics on-chain.'

                #swagger.parameters['Authorization'] = {
                    in: 'cookie',
                    description: 'Bearer token for authentication',
                    required: true,
                    type: 'string'
                }

                #swagger.responses[200] = {
                    description: 'Visit summaries retrieved successfully',
                    schema: {
                        message: 'Visit summaries retrieved successfully',
                        data: [{ recordId: 'uuid-string', content: {} }]
                    }
                }
                #swagger.responses[401] = {
                    description: 'Unauthorized – missing or invalid token'
                }
            */
      AuthMiddleware,
      RoleMiddleware(Role.PATIENT),
      this.medicalRecordController.getPatientVisitSummaries,
    );

    this.router.post(
      `${this.path}/patient/medical-history`,
      /*
                                #swagger.path = '/medical-records/patient/medical-history'
                                #swagger.method = 'post'
                                #swagger.tags = ['Medical Records - Patient']
                                #swagger.description = 'Patient adds a new MEDICAL_HISTORY entry. Type is fixed — only name and content are required.'

                #swagger.parameters['Authorization'] = {
                    in: 'cookie',
                    description: 'Bearer token for authentication',
                    required: true,
                    type: 'string'
                }

                #swagger.parameters['body'] = {
                    in: 'body',
                    required: true,
                    schema: {
                        name: 'Previous Surgeries',
                        content: { conditions: ['hypertension'], surgeries: ['appendectomy'] }
                    }
                }

                #swagger.responses[201] = {
                    description: 'Medical history entry created successfully',
                    schema: { message: 'Medical history entry created successfully', data: { recordId: 'uuid-string' } }
                }
                #swagger.responses[400] = { description: 'Validation failed' }
                #swagger.responses[401] = { description: 'Unauthorized' }
            */
      AuthMiddleware,
      RoleMiddleware(Role.PATIENT),
      ValidationMiddleware(CreatePatientMedicalHistoryDto),
      this.medicalRecordController.createPatientMedicalHistory,
    );

    this.router.patch(
      `${this.path}/patient/medical-history/:recordId`,
      /*
                #swagger.path = '/medical-records/patient/medical-history/{recordId}'
                #swagger.method = 'patch'
                #swagger.tags = ['Medical Records - Patient']
                #swagger.description = 'Patient updates an existing MEDICAL_HISTORY record they own. At least one of name or content must be provided. If content changes, the file is re-encrypted and re-uploaded to IPFS.'

                #swagger.parameters['Authorization'] = {
                    in: 'cookie',
                    description: 'Bearer token for authentication',
                    required: true,
                    type: 'string'
                }

                #swagger.parameters['recordId'] = {
                    in: 'path',
                    description: 'UUID of the record to update',
                    required: true,
                    type: 'string'
                }

                #swagger.parameters['body'] = {
                    in: 'body',
                    required: true,
                    schema: {
                        name: 'Updated History Title',
                        content: { conditions: ['hypertension'], surgeries: ['appendectomy'] }
                    }
                }

                #swagger.responses[200] = {
                    description: 'Medical history entry updated successfully',
                    schema: { message: 'Medical history entry updated successfully' }
                }
                #swagger.responses[400] = { description: 'Validation failed' }
                #swagger.responses[401] = { description: 'Unauthorized' }
                #swagger.responses[404] = { description: 'Record not found or not owned by patient' }
            */
      AuthMiddleware,
      RoleMiddleware(Role.PATIENT),
      ValidationMiddleware(UpdatePatientMedicalHistoryDto),
      this.medicalRecordController.updatePatientMedicalHistory,
    );

    this.router.delete(
      `${this.path}/patient/medical-history/:recordId`,
      /*
                #swagger.path = '/medical-records/patient/medical-history/{recordId}'
                #swagger.method = 'delete'
                #swagger.tags = ['Medical Records - Patient']
                #swagger.description = 'Patient soft-deletes one of their own MEDICAL_HISTORY records. Also removes it from blockchain and IPFS.'

                #swagger.parameters['Authorization'] = {
                    in: 'cookie',
                    description: 'Bearer token for authentication',
                    required: true,
                    type: 'string'
                }

                #swagger.parameters['recordId'] = {
                    in: 'path',
                    description: 'UUID of the record to delete',
                    required: true,
                    type: 'string'
                }

                #swagger.responses[200] = {
                    description: 'Medical history entry deleted successfully',
                    schema: { message: 'Medical history entry deleted successfully' }
                }
                #swagger.responses[401] = { description: 'Unauthorized' }
                #swagger.responses[404] = { description: 'Record not found or not owned by patient' }
            */
      AuthMiddleware,
      RoleMiddleware(Role.PATIENT),
      this.medicalRecordController.deletePatientMedicalHistory,
    );

    this.router.get(
      `${this.path}/patient/medical-history`,
      /*
                                #swagger.path = '/medical-records/patient/medical-history'
                                #swagger.method = 'get'
                                #swagger.tags = ['Medical Records - Patient']
                                #swagger.description = 'Patient retrieves all their MEDICAL_HISTORY records, decrypted and authorized across all clinics on-chain.'

                #swagger.parameters['Authorization'] = {
                    in: 'cookie',
                    description: 'Bearer token for authentication',
                    required: true,
                    type: 'string'
                }

                #swagger.responses[200] = {
                    description: 'Medical history retrieved successfully',
                    schema: {
                        message: 'Medical history retrieved successfully',
                        data: [{ recordId: 'uuid-string', content: {} }]
                    }
                }
                #swagger.responses[401] = {
                    description: 'Unauthorized – missing or invalid token'
                }
            */
      AuthMiddleware,
      RoleMiddleware(Role.PATIENT),
      this.medicalRecordController.getPatientMedicalHistory,
    );

    this.router.get(
      `${this.path}/:patientId/visit-summaries`,
      /*
                                #swagger.path = '/medical-records/{patientId}/visit-summaries'
                                #swagger.method = 'get'
                                #swagger.tags = ['Medical Records - Doctor']
                                #swagger.description = 'Doctor retrieves VISIT_SUMMARY records for a patient. Only returns records the doctor\'s clinic(s) are authorized to access on-chain.'
                #swagger.parameters['patientId'] = { in: 'path', required: true, type: 'string', description: 'UUID of the patient' }
                #swagger.responses[200] = { description: 'Visit summaries retrieved successfully', schema: { message: 'Visit summaries retrieved successfully', data: [{ recordId: 'uuid-string', content: {} }] } }
                #swagger.responses[401] = { description: 'Unauthorized' }
                #swagger.responses[403] = { description: 'Access denied' }
            */
      AuthMiddleware,
      RoleMiddleware(Role.DOCTOR),
      this.medicalRecordController.getDoctorPatientVisitSummaries,
    );

    this.router.get(
      `${this.path}/:patientId/medical-history`,
      /*
                                #swagger.path = '/medical-records/{patientId}/medical-history'
                                #swagger.method = 'get'
                                #swagger.tags = ['Medical Records - Doctor']
                                #swagger.description = 'Doctor retrieves MEDICAL_HISTORY records for a patient. Only returns records the doctor\'s clinic(s) are authorized to access on-chain.'
                #swagger.parameters['patientId'] = { in: 'path', required: true, type: 'string', description: 'UUID of the patient' }
                #swagger.responses[200] = { description: 'Medical history retrieved successfully', schema: { message: 'Medical history retrieved successfully', data: [{ recordId: 'uuid-string', content: {} }] } }
                #swagger.responses[401] = { description: 'Unauthorized' }
                #swagger.responses[403] = { description: 'Access denied' }
            */
      AuthMiddleware,
      RoleMiddleware(Role.DOCTOR),
      this.medicalRecordController.getDoctorPatientMedicalHistory,
    );

    this.router.post(
      `${this.path}/grant-access`,
      /*
                                #swagger.path = '/medical-records/grant-access'
                                #swagger.method = 'post'
                                #swagger.tags = ['Medical Records - Patient']
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
      this.medicalRecordController.grantPatientAccess,
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
