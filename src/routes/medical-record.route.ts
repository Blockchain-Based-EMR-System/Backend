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
            `${this.path}/:id`,
            /*
                #swagger.path = '/record/{id}'
                #swagger.method = 'get'
                #swagger.tags = ['Medical Records']
                #swagger.description = 'Downloads and decrypts a single medical record file. Returns raw file bytes with appropriate Content-Type header.'

                #swagger.parameters['Authorization'] = {
                    in: 'cookie',
                    description: 'Bearer token for authentication',
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
                    description: 'Decrypted file bytes streamed back with Content-Type, Content-Disposition, x-record-id, x-patient-id, x-record-type headers set'
                }
                #swagger.responses[401] = {
                    description: 'Unauthorized – missing or invalid token'
                }
                #swagger.responses[404] = {
                    description: 'Record not found or already deleted'
                }
            */
            AuthMiddleware,
            this.medicalRecordController.getRecordFile
        );

        this.router.post(
            `${this.path}/:doctorId/upload`,
            /*
                #swagger.path = '/record/{doctorId}/upload'
                #swagger.method = 'post'
                #swagger.tags = ['Medical Records']
                #swagger.description = 'Patient uploads a new medical record file'

                #swagger.parameters['Authorization'] = {
                    in: 'cookie',
                    description: 'Bearer token for authentication',
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

                #swagger.parameters['clinicId'] = {
                    in: 'formData',
                    description: 'UUID of the clinic',
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

        

        this.router.delete(
            `${this.path}/:id`,
            /*
                #swagger.path = '/record/{id}'
                #swagger.method = 'delete'
                #swagger.tags = ['Medical Records']
                #swagger.description = 'Soft-deletes a medical record (sets deleted_at). File remains on IPFS but is inaccessible via the API.'

                #swagger.parameters['Authorization'] = {
                    in: 'cookie',
                    description: 'Bearer token for authentication',
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
                    schema: {
                        message: 'Medical record deleted successfully'
                    }
                }
                #swagger.responses[401] = {
                    description: 'Unauthorized – missing or invalid token'
                }
                #swagger.responses[404] = {
                    description: 'Record not found or already deleted'
                }
            */
            AuthMiddleware,
            RoleMiddleware(Role.PATIENT, Role.DOCTOR),
            this.medicalRecordController.deleteRecord
        );
    }
}