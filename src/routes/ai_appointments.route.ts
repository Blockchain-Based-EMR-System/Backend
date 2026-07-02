import { AiAppointmentsController } from "@/controllers/ai_appointments.controller";
import { Routes } from "@/interfaces";
import { AuthMiddleware } from "@/middlewares/auth.middleware";
import { Router } from "express";

export class AiAppointmentsRoute implements Routes {
    public path: string = ""
    public router: Router = Router()
    private aiAppointmentsController = new AiAppointmentsController();

    constructor() {
        this.initializeRoutes()
    };

    private initializeRoutes(): void {
        this.router.get(`${this.path}/:appointmentId/upload-url`,
            /* 
                #swagger.path = '/{appointmentId}/upload-url'
                #swagger.method = 'get'
                #swagger.tags = ['AI Appointments']
                #swagger.parameters['Authorization'] = {
                    in: 'cookie',
                    description: 'Bearer token for authentication',
                    required: true,
                    type: 'string'
                }
                #swagger.description = 'Get a pre-signed upload URL for uploading audio files to S3'
                #swagger.parameters['appointmentId'] = {
                    in: 'path',
                    description: 'The ID of the appointment',
                    required: true,
                    type: 'string'
                }
                #swagger.parameters['userType'] = {
                    in: 'query',
                    description: 'Type of user recording the audio (DOCTOR, PATIENT, or MIXED)',
                    required: true,
                    type: 'string',
                    enum: ['DOCTOR', 'PATIENT', 'MIXED']
                }
                #swagger.responses[200] = {
                    description: 'Upload URL generated successfully',
                    schema: {
                        message: 'Upload URL generated successfully',
                        messageAr: 'تم إنشاء رابط التحميل بنجاح',
                        data: {
                            uploadUrl: 'string',
                            objectKey: 'string'
                        }
                    }
                }
                #swagger.responses[400] = {
                    description: 'Bad request - invalid userType parameter'
                }
                #swagger.responses[401] = {
                    description: 'Unauthorized - missing or invalid token'
                }
                #swagger.responses[404] = {
                    description: 'Appointment not found'
                }
            */
            AuthMiddleware,
            this.aiAppointmentsController.getUploadUrl
        )

        this.router.post(`${this.path}/:appointmentId/process-audio-ai`,
            /* 
                #swagger.path = '/{appointmentId}/process-audio-ai'
                #swagger.method = 'post'
                #swagger.tags = ['AI Appointments']
                #swagger.parameters['Authorization'] = {
                    in: 'cookie',
                    description: 'Bearer token for authentication',
                    required: true,
                    type: 'string'
                }
                #swagger.description = 'Process audio recordings using AI to generate SOAP notes. Accepts either separate doctor/patient audio keys or a single mixed audio key'
                #swagger.parameters['appointmentId'] = {
                    in: 'path',
                    description: 'The ID of the appointment',
                    required: true,
                    type: 'string'
                }
                #swagger.parameters['body'] = {
                    in: 'body',
                    description: 'Audio file keys for processing. Provide either (doctorKey AND patientKey) OR mixedKey',
                    required: true,
                    schema: {
                        $doctorKey: 'appointments/appointmentId/DOCTOR.webm',
                        $patientKey: 'appointments/appointmentId/PATIENT.webm',
                        $mixedKey: 'appointments/appointmentId/MIXED.webm',
                        $prompt: 'string'
                    }
                }
                #swagger.responses[202] = {
                    description: 'SOAP notes generated successfully',
                    schema: {
                        message: 'SOAP generated successfully',
                        messageAr: 'تم إنشاء ملاحظات SOAP بنجاح',
                        data: {
                            SOAP: {
                                subjective: 'string',
                                objective: 'string',
                                assessment: 'string',
                                plan: 'string'
                            }
                        }
                    }
                }
                #swagger.responses[400] = {
                    description: 'Bad request - missing required audio keys'
                }
                #swagger.responses[401] = {
                    description: 'Unauthorized - missing or invalid token'
                }
                #swagger.responses[404] = {
                    description: 'Appointment not found'
                }
            */
            AuthMiddleware,
            this.aiAppointmentsController.processAudioAI
        )
    }
}