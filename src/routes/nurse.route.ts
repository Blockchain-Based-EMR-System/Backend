import { Routes } from "@/interfaces";
import { ValidationMiddleware } from "@/middlewares/validation.middleware";
import { Router } from "express";
import { NurseController } from "@/controllers/nurse.controller";
import { NurseLoginRequestDto, NurseSetPasswordRequestDto, NurseSignupRequestDto } from "@/dtos/nurses.dto";
import { AuthMiddleware, RoleMiddleware } from "@/middlewares/auth.middleware";
import { Role } from "@prisma/client";
import { uploadPdf } from "@/middlewares/multer.middleware";

export class NurseRoute implements Routes {
    public path = '/nurses'
    public router = Router();
    public nursesController = new NurseController();
    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.post(
            `${this.path}/signup`,
            /* 
                #swagger.path = '/nurses/signup'
                #swagger.method = 'post'
                #swagger.tags = ['Nurses']
                #swagger.description = 'Creates a new nurse account. Requires national ID card upload and optional bonus file'
                #swagger.consumes = ['multipart/form-data']

                #swagger.parameters['name'] = {
                    in: 'formData',
                    description: 'name of the nurse',
                    required: true,
                    type: 'string',
                }
                #swagger.parameters['email'] = {
                    in: 'formData',
                    description: 'Email address',
                    required: true,
                    type: 'string',
                }
                #swagger.parameters['phone'] = {
                    in: 'formData',
                    description: 'Phone number',
                    required: true,
                    type: 'string',
                }
                #swagger.parameters['password'] = {
                    in: 'formData',
                    description: 'Initial password for the account',
                    required: true,
                    type: 'string',
                }
                #swagger.parameters['years_of_experience'] = {
                    in: 'formData',
                    description: 'Number of years of professional nursing experience',
                    required: true,
                    type: 'integer',
                }
                #swagger.parameters['gender'] = {
                    in: 'formData',
                    description: 'Gender (must match Prisma enum: MALE or FEMALE)',
                    required: true,
                    type: 'string',
                }
                #swagger.parameters['date_of_birth'] = {
                    in: 'formData',
                    description: 'Date of birth (format YYYY-MM-DD)',
                    required: true,
                    type: 'string',
                }
                #swagger.parameters['brief'] = {
                    in: 'formData',
                    description: 'Short professional summary / bio (optional)',
                    required: false,
                    type: 'string',
                }
                #swagger.parameters['nationalCard'] = {
                    in: 'formData',
                    description: 'National ID card or passport scan (PDF only)',
                    required: true,
                    type: 'file'
                }
                #swagger.parameters['bonusFile'] = {
                    in: 'formData',
                    description: 'Additional document: nursing license, experience certificate, etc.',
                    required: false,
                    type: 'file'
                }

                #swagger.responses[201] = {
                    description: 'Account created successfully – awaiting admin approval',
                    schema: {
                        message_en: "Nurse account created successfully. Please wait for verification.",
                        message_ar: "تم إنشاء حساب الممرضة بنجاح. يرجى الانتظار للموافقة عليه.",
                    }
                }
                #swagger.responses[400] = {
                    description: 'Validation failed (missing fields, wrong file type, invalid date format, etc.)'
                }
                #swagger.responses[500] = {
                    description: 'Server error during file upload or database transaction'
                }
            */

            uploadPdf.fields([
                { name: 'nationalCard', maxCount: 1 },
                { name: 'bonusFile', maxCount: 1 },
            ]),
            ValidationMiddleware(NurseSignupRequestDto),
            this.nursesController.nurseSignup,
        )

        this.router.post(
            `${this.path}/login`,
            /* 
                #swagger.path = '/nurses/login'
                #swagger.method = 'post'
                #swagger.tags = ['Nurses']
                #swagger.description = 'Authenticates nurse credentials'
                #swagger.parameters['body'] = {
                    in: 'body',
                    description: 'Nurse login data',
                    required: true,
                    schema: {
                        $emailOrUsername: 'nurse@example.com',
                        $password: 'SecurePassword123',
                        $rememberMe: "true"
                    }
                }

                #swagger.responses[200] = {
                    description: 'Login successful – approved nurse with completed profile',
                    schema: {
                        data: {
                            id: 'uuid-string',
                            name: 'Maxine Lee',
                            email: 'maxine.lee@example.com',
                            username: 'maxine.lee',
                            phone: '+201234567890',
                            gender: 'FEMALE',
                            nurse: { account_status: 'APPROVED' }
                        },
                        messageEn: 'Nurse retrieved successfully',
                        messageAr: 'تم استرجاع بيانات الممرض بنجاح'
                    }
                }
                #swagger.responses[401] = {
                    description: 'Invalid credentials (wrong email/username or password)'
                }
                #swagger.responses[403] = {
                    description: 'Account not approved (PENDING or REJECTED)'
                }
            */
            ValidationMiddleware(NurseLoginRequestDto),
            this.nursesController.nurseLogin
        );

        this.router.patch(
            `${this.path}/set-password`,
            /* 
                #swagger.path = '/nurses/set-password'
                #swagger.method = 'patch'
                #swagger.tags = ['Nurses']
                #swagger.parameters['Authorization'] = {
                    in: 'cookie',
                    description: 'Bearer token for authentication',
                    required: true,
                    type: 'string'
                }
                #swagger.parameters['body'] = {
                    in: 'body',
                    description: 'New password data',
                    required: true,
                    schema: {
                        $password: 'NewSecurePassword123'
                    }
                }
                #swagger.responses[200] = {
                    description: 'Password set successfully',
                    schema: {
                        messageEn: 'Password updated successfully',
                        messageAr: "تم تحديث كلمة المرور بنجاح"
                    }
                }
                #swagger.responses[400] = {
                    description: 'Password already set / validation error'
                }
                #swagger.responses[401] = {
                    description: 'Unauthorized – missing or invalid token'
                }
                #swagger.responses[403] = {
                    description: 'Forbidden – user is not a nurse role'
                }
                #swagger.responses[404] = {
                    description: 'Nurse user not found'
                }
                    
            */
            ValidationMiddleware(NurseSetPasswordRequestDto),
            AuthMiddleware,
            RoleMiddleware(Role.NURSE),
            this.nursesController.nurseSetPassword
        );

        this.router.get(
            `${this.path}/announcements`,
            /* 
                #swagger.path = '/nurses/announcements'
                #swagger.method = 'get'
                #swagger.tags = ['Nurses']
                #swagger.description = 'Retrieves all active announcements for the nurse'

                #swagger.parameters['Authorization'] = {
                    in: 'cookie',
                    description: 'Bearer token for authentication',
                    required: true,
                    type: 'string'
                }

                #swagger.responses[200] = {
                    description: 'Announcements retrieved successfully',
                    schema: {
                        data: [
                            {
                                id: 'uuid-string',
                                doctor: {
                                    id: 'uuid-string',
                                    name: 'Dr. House',
                                    gender: 'MALE',
                                    profilePic: 'https://res.cloudinary.com/example/image.jpg'
                                },
                                clinic: {
                                    id: 'uuid-string',
                                    name: 'Al Salam Clinic',
                                    address: '123 Main St, Cairo',
                                    address_maps_link: 'https://maps.google.com/?q=...'
                                },
                                working_days: [
                                    {
                                        day_of_week: 'MONDAY',
                                        start_time: '09:00',
                                        end_time: '17:00'
                                    }
                                ],
                                status: 'PENDING',
                                gender: 'FEMALE',
                                max_age: 40,
                                years_of_experience: 3,
                                notes: 'Looking for an experienced nurse'
                            }
                        ],
                        messageEn: 'Announcements retrieved successfully',
                        messageAr: 'تم استرجاع الإعلانات بنجاح'
                    }
                }
                #swagger.responses[401] = {
                    description: 'Unauthorized – missing or invalid token'
                }
                #swagger.responses[404] = {
                    description: 'Nurse account not approved (PENDING or REJECTED)'
                }
            */
            AuthMiddleware,
            this.nursesController.getAllAnnouncements
        );

        this.router.get(
            `${this.path}/applications`,
            /* 
                #swagger.path = '/nurses/applications'
                #swagger.method = 'get'
                #swagger.tags = ['Nurses']
                #swagger.description = 'get all announcements the nurse has applied to'

                #swagger.parameters['Authorization'] = {
                    in: 'cookie',
                    description: 'Bearer token for authentication',
                    required: true,
                    type: 'string'
                }

                #swagger.responses[200] = {
                    description: 'Applications retrieved successfully',
                    schema: {
                        data: [
                            {
                                id: 'uuid-string',
                                application_status: 'PENDING',
                                doctor: {
                                    id: 'uuid-string',
                                    name: 'Dr. House',
                                    gender: 'MALE',
                                    profilePic: 'https://res.cloudinary.com/example/image.jpg'
                                },
                                clinic: {
                                    id: 'uuid-string',
                                    name: 'Al Salam Clinic',
                                    address: '123 Main St, Cairo',
                                    address_maps_link: 'https://maps.google.com/?q=...'
                                },
                                working_days: [
                                    {
                                        day_of_week: 'MONDAY',
                                        start_time: '09:00',
                                        end_time: '17:00'
                                    }
                                ],
                                status: 'POSTED',
                                gender: 'FEMALE',
                                max_age: 40,
                                years_of_experience: 3,
                                notes: 'Looking for an experienced nurse'
                            }
                        ],
                        messageEn: 'Applications retrieved successfully',
                        messageAr: 'تم استرجاع الطلبات بنجاح'
                    }
                }
                #swagger.responses[400] = {
                    description: 'Nurse ID not found in token'
                }
                #swagger.responses[401] = {
                    description: 'Unauthorized – missing or invalid token'
                }
                #swagger.responses[404] = {
                    description: 'Nurse account not approved (PENDING or REJECTED)'
                }
            */
            AuthMiddleware,
            this.nursesController.getNurseApplications
        );

        this.router.post(
            `${this.path}/announcements/:announcementId/apply`,
            /* 
                #swagger.path = '/nurses/announcements/{announcementId}/apply'
                #swagger.method = 'post'
                #swagger.tags = ['Nurses']
                #swagger.description = 'Apply to a specific announcement'

                #swagger.parameters['announcementId'] = {
                    in: 'path',
                    description: 'ID of the announcement to apply for',
                    required: true,
                    type: 'string'
                }
                #swagger.parameters['Authorization'] = {
                    in: 'cookie',
                    description: 'Bearer token for authentication',
                    required: true,
                    type: 'string'
                }

                #swagger.responses[200] = {
                    description: 'Application submitted successfully',
                    schema: {
                        messageEn: 'Applied to announcement successfully',
                        messageAr: 'تم التقديم على الإعلان بنجاح'
                    }
                }
                #swagger.responses[400] = {
                    description: 'Invalid announcement ID / already applied / validation error'
                }
                #swagger.responses[401] = {
                    description: 'Unauthorized – missing or invalid token'
                }
                #swagger.responses[404] = {
                    description: 'Announcement not found / Nurse account not approved (PENDING or REJECTED)'
                }
            */
            AuthMiddleware,
            this.nursesController.applyToAnnouncement
        )

        this.router.get(
            `${this.path}/schedule`,
            /* 
                #swagger.path = '/nurses/schedule'
                #swagger.method = 'get'
                #swagger.tags = ['Nurses']
                #swagger.description = 'get the schedule for the nurse'

                #swagger.parameters['Authorization'] = {
                    in: 'cookie',
                    description: 'Bearer token for authentication',
                    required: true,
                    type: 'string'
                }

                #swagger.responses[200] = {
                    description: 'Schedule retrieved successfully',
                    schema: {
                        data: [
                            {
                                id: 'uuid-string',
                                doctor: {
                                    id: 'uuid-string',
                                    name: 'Dr. House',
                                    gender: 'MALE',
                                    profilePic: 'https://res.cloudinary.com/example/image.jpg'
                                },
                                clinic: {
                                    id: 'uuid-string',
                                    name: 'Al Salam Clinic',
                                    address: '123 Main St, Cairo',
                                    address_maps_link: 'https://maps.google.com/?q=...'
                                },
                                working_days: [
                                    {
                                        day_of_week: 'MONDAY',
                                        start_time: '09:00',
                                        end_time: '17:00'
                                    }
                                ]
                            }
                        ],
                        messageEn: 'Nurse schedule retrieved successfully',
                        messageAr: 'تم استرجاع جدول الممرضة بنجاح'
                    }
                }
                #swagger.responses[400] = {
                    description: 'Nurse ID not found in token'
                }
                #swagger.responses[401] = {
                    description: 'Unauthorized – missing or invalid token'
                }
                #swagger.responses[404] = {
                    description: 'Nurse account not approved or no schedule assigned'
                }
            */
            AuthMiddleware,
            this.nursesController.getNurseSchedule
        );
    }
}