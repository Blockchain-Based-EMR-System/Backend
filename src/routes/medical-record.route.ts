import { Routes } from "@/interfaces";
import { ValidationMiddleware } from "@/middlewares/validation.middleware";
import { Router } from "express";
import { MedicalRecordController } from "@/controllers/medical-records.controller";
import { AuthMiddleware, RoleMiddleware } from "@/middlewares/auth.middleware";
import { Role } from "@prisma/client";
import { CreateMedicalRecordDto } from "@/dtos/medical-records.dto";
import { uploadSingleFile } from "@/middlewares/upload.middleware";

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
            this.medicalRecordController.checkIpfsHealth
        );

        this.router.get(
            `${this.path}/patient`,
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
            this.medicalRecordController.getPatientMedicalRecords
        );

        this.router.get(
            `${this.path}/:clinicId/:id`,
            /*
                #swagger.path = '/record/{clinicId}/{id}'
                #swagger.method = 'get'
                #swagger.tags = ['Medical Records']
                #swagger.description = 'Downloads and decrypts a single medical record file. The clinicId identifies the caller\'s clinic for on-chain authorization.'

                #swagger.parameters['Authorization'] = {
                    in: 'cookie',
                    description: 'Bearer token for authentication',
                    required: true,
                    type: 'string'
                }

                #swagger.parameters['clinicId'] = {
                    in: 'path',
                    description: 'UUID of the caller\'s clinic (used for on-chain access check)',
                    required: true,
                    type: 'string'
                }

                #swagger.parameters['id'] = {
                    in: 'path',
                    description: 'UUID of the medical record',
                    required: true,
                    type: 'string'
                }

                #swagger.responses[200] = {
                    description: 'Decrypted file returned as base64 with record metadata'
                }
                #swagger.responses[401] = {
                    description: 'Unauthorized – missing or invalid token'
                }
                #swagger.responses[403] = {
                    description: 'Access denied – clinic not authorized for this record'
                }
                #swagger.responses[404] = {
                    description: 'Record not found or already deleted'
                }
            */
            AuthMiddleware,
            this.medicalRecordController.getRecordFile
        );

        this.router.post(
            `${this.path}/:clinicId/:doctorId/upload`,
            /*
                #swagger.path = '/record/{clinicId}/{doctorId}/upload'
                #swagger.method = 'post'
                #swagger.tags = ['Medical Records']
                #swagger.description = 'Patient uploads a new medical record file. The clinic identity is used to store the encryption key on the blockchain.'

                #swagger.parameters['Authorization'] = {
                    in: 'cookie',
                    description: 'Bearer token for authentication',
                    required: true,
                    type: 'string'
                }

                #swagger.parameters['clinicId'] = {
                    in: 'path',
                    description: 'UUID of the clinic whose Fabric identity will store the encryption key',
                    required: true,
                    type: 'string'
                }

                #swagger.parameters['doctorId'] = {
                    in: 'path',
                    description: 'UUID of the doctor associated with this record',
                    required: true,
                    type: 'string'
                }

                #swagger.parameters['file'] = {
                    in: 'formData',
                    description: 'The medical record file',
                    required: true,
                    type: 'file'
                }

                #swagger.parameters['name'] = {
                    in: 'formData',
                    description: 'Display name for the record',
                    required: true,
                    type: 'string'
                }

                #swagger.parameters['type'] = {
                    in: 'formData',
                    description: 'Record type enum (LAB_RESULT | SCAN | DIAGNOSIS | VISIT_SUMMARY | SOAP_NOTE | MEDICAL_HISTORY)',
                    required: true,
                    type: 'string'
                }

                #swagger.parameters['appointmentId'] = {
                    in: 'formData',
                    description: 'UUID of the appointment (optional)',
                    required: false,
                    type: 'string'
                }

                #swagger.responses[201] = {
                    description: 'Medical record uploaded successfully',
                    schema: {
                        message: 'Medical record uploaded successfully'
                    }
                }
                #swagger.responses[400] = {
                    description: 'No file uploaded or validation failed'
                }
                #swagger.responses[401] = {
                    description: 'Unauthorized – missing or invalid token'
                }
                #swagger.responses[404] = {
                    description: 'Patient encryption key not found'
                }
            */
            AuthMiddleware,
            RoleMiddleware(Role.PATIENT),
            uploadSingleFile,
            ValidationMiddleware(CreateMedicalRecordDto),
            this.medicalRecordController.uploadRecord
        );

        

        this.router.delete(
            `${this.path}/:clinicId/:id`,
            /*
                #swagger.path = '/record/{clinicId}/{id}'
                #swagger.method = 'delete'
                #swagger.tags = ['Medical Records']
                #swagger.description = 'Soft-deletes a medical record. The clinicId identifies the caller\'s clinic; chaincode enforces owner-only deletion.'

                #swagger.parameters['Authorization'] = {
                    in: 'cookie',
                    description: 'Bearer token for authentication',
                    required: true,
                    type: 'string'
                }

                #swagger.parameters['clinicId'] = {
                    in: 'path',
                    description: 'UUID of the caller\'s clinic (must be the record owner)',
                    required: true,
                    type: 'string'
                }

                #swagger.parameters['id'] = {
                    in: 'path',
                    description: 'UUID of the medical record to delete',
                    required: true,
                    type: 'string'
                }

                #swagger.responses[200] = {
                    description: 'Medical record deleted successfully',
                    schema: { message: 'Medical record deleted successfully' }
                }
                #swagger.responses[401] = {
                    description: 'Unauthorized – missing or invalid token'
                }
                #swagger.responses[403] = {
                    description: 'Only the owner clinic can delete this record'
                }
                #swagger.responses[404] = {
                    description: 'Record not found or already deleted'
                }
            */
            AuthMiddleware,
            RoleMiddleware(Role.PATIENT, Role.DOCTOR),
            this.medicalRecordController.deleteRecord
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
            this.medicalRecordController.grantAccess
        );

        this.router.post(
            `${this.path}/:clinicId/:patientId/doctor-upload`,
            /*
                #swagger.path = '/record/{clinicId}/{patientId}/doctor-upload'
                #swagger.method = 'post'
                #swagger.tags = ['Medical Records']
                #swagger.description = 'Doctor uploads a medical record for a patient. Validates the doctor works at the clinic. The clinic identity is used for blockchain operations.'

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

                #swagger.parameters['file'] = {
                    in: 'formData',
                    description: 'The medical record file',
                    required: true,
                    type: 'file'
                }

                #swagger.parameters['name'] = {
                    in: 'formData',
                    description: 'Display name for the record',
                    required: true,
                    type: 'string'
                }

                #swagger.parameters['type'] = {
                    in: 'formData',
                    description: 'Record type enum (LAB_RESULT | SCAN | DIAGNOSIS | VISIT_SUMMARY | SOAP_NOTE | MEDICAL_HISTORY)',
                    required: true,
                    type: 'string'
                }

                #swagger.responses[201] = {
                    description: 'Medical record uploaded successfully',
                    schema: { message: 'Medical record uploaded successfully', data: { recordId: 'uuid-string' } }
                }
                #swagger.responses[400] = {
                    description: 'No file uploaded or validation failed'
                }
                #swagger.responses[403] = {
                    description: 'Doctor is not associated with this clinic'
                }
            */
            AuthMiddleware,
            RoleMiddleware(Role.DOCTOR),
            uploadSingleFile,
            ValidationMiddleware(CreateMedicalRecordDto),
            this.medicalRecordController.addDoctorRecord
        );

        this.router.get(
            `${this.path}/:clinicId/:patientId/soap-notes`,
            /*
                #swagger.path = '/record/{clinicId}/{patientId}/soap-notes'
                #swagger.method = 'get'
                #swagger.tags = ['Medical Records']
                #swagger.description = 'Retrieves all SOAP_NOTE records for a patient, decrypts the JSON files, and returns their parsed contents. Requires on-chain authorization.'

                #swagger.parameters['Authorization'] = {
                    in: 'cookie',
                    description: 'Bearer token for authentication',
                    required: true,
                    type: 'string'
                }

                #swagger.parameters['clinicId'] = {
                    in: 'path',
                    description: 'UUID of the caller\'s clinic (for on-chain access check)',
                    required: true,
                    type: 'string'
                }

                #swagger.parameters['patientId'] = {
                    in: 'path',
                    description: 'UUID of the patient',
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
                #swagger.responses[403] = {
                    description: 'Access denied – clinic not authorized'
                }
            */
            AuthMiddleware,
            RoleMiddleware(Role.DOCTOR),
            this.medicalRecordController.getSOAPNotes
        );
    }
}