import { DoctorController } from "@/controllers/doctor.controller";
import { DoctorLoginRequestDto, DoctorSetPasswordRequestDto, DoctorSignupRequestDto, PostAnnouncementDto } from "@/dtos/doctors.dto";
import { Routes } from "@/interfaces";
import { ValidationMiddleware } from "@/middlewares/validation.middleware";
import { Router } from "express";
import { errorWrapper } from "@/utils/errorWrapper";
import { AuthMiddleware, RoleMiddleware } from "@/middlewares/auth.middleware";
import { Role } from "@prisma/client";
import { uploadPdf } from "@/middlewares/multer.middleware";


export class DoctorsRoute implements Routes {
    public path = '/doctors'
    public router = Router();
    public doctorsController = new DoctorController();
    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {

        // Doctor Signup Route
        this.router.post(
            `/doctors/signup`,
            /* 
                #swagger.tags = ['Doctors']
                #swagger.consumes = ['multipart/form-data']
                #swagger.parameters['email'] = {
                    in: 'formData',
                    description: 'Doctor email address',
                    required: true,
                    type: 'string'
                }
                #swagger.parameters['name'] = {
                    in: 'formData',
                    description: 'Doctor full name',
                    required: true,
                    type: 'string'
                }
                #swagger.parameters['phone'] = {
                    in: 'formData',
                    description: 'Doctor phone number',
                    required: true,
                    type: 'string'
                }
                #swagger.parameters['password'] = {
                    in: 'formData',
                    description: 'Doctor password',
                    required: true,
                    type: 'string'
                }
                #swagger.parameters['gender'] = {
                    in: 'formData',
                    description: 'Doctor gender (MALE or FEMALE)',
                    required: true,
                    type: 'string',
                    enum: ['MALE', 'FEMALE']
                }
                #swagger.parameters['date_of_birth'] = {
                    in: 'formData',
                    description: 'Doctor date of birth (YYYY-MM-DD)',
                    required: true,
                    type: 'string'
                }
                #swagger.parameters['graduationCertificate'] = {
                    in: 'formData',
                    description: 'Graduation certificate PDF',
                    required: true,
                    type: 'file'
                }
                #swagger.parameters['membershipCard'] = {
                    in: 'formData',
                    description: 'Membership card PDF',
                    required: true,
                    type: 'file'
                }
                #swagger.parameters['professionalPracticeCard'] = {
                    in: 'formData',
                    description: 'Professional practice card PDF',
                    required: true,
                    type: 'file'
                }
                #swagger.parameters['mastersCertificate'] = {
                    in: 'formData',
                    description: 'Masters certificate PDF',
                    required: true,
                    type: 'file'
                }
                #swagger.parameters['fellowshipCertificate'] = {
                    in: 'formData',
                    description: 'Fellowship certificate PDF',
                    required: true,
                    type: 'file'
                }
                #swagger.parameters['unionSpecializationCertificate'] = {
                    in: 'formData',
                    description: 'Union specialization certificate PDF',
                    required: true,
                    type: 'file'
                }
                #swagger.responses[201] = {
                    description: 'Doctor signup successful',
                    schema: {
                        messageEn: 'Doctor registered successfully',
                        messageAr: "تم تسجيل الطبيب بنجاح"
                    }
                }
            */
            uploadPdf.fields([
                { name: 'graduationCertificate', maxCount: 1 },
                { name: 'membershipCard', maxCount: 1 },
                { name: 'professionalPracticeCard', maxCount: 1 },
                { name: 'mastersCertificate', maxCount: 1 },
                { name: 'fellowshipCertificate', maxCount: 1 },
                { name: 'unionSpecializationCertificate', maxCount: 1 },
            ]),
            ValidationMiddleware(DoctorSignupRequestDto, false, false, false, true),
            errorWrapper(this.doctorsController.doctorSignup)
        );

        // Doctor Login Route
        this.router.post(
            `/doctors/login`,
            /* 
                #swagger.tags = ['Doctors']
                #swagger.parameters['body'] = {
                    in: 'body',
                    description: 'Doctor login data',
                    required: true,
                    schema: {
                        $emailOrUsername: 'doctor@example.com',
                        $password: 'SecurePassword123',
                        $rememberMe: "true"
                    }
                }
                #swagger.responses[200] = {
                    description: 'Doctor login successful',
                    schema: {
                        data: {
                            id: 1,
                            email: 'test@example.com',
                            name: 'Dr. Smith',
                            username: 'drsmith',
                            phone: '1234567890',
                            gender: 'MALE',
                            doctor: {
                                specialization: 'CARDIOLOGY',
                                account_status: 'APPROVED'
                            }
                        },
                        messageEn: 'Doctor logged in successfully',
                        messageAr: "تم تسجيل دخول الطبيب بنجاح"
                    }
                }
            */
            ValidationMiddleware(DoctorLoginRequestDto),
            errorWrapper(this.doctorsController.doctorLogin)
        );

        // Doctor Set Password Route
        this.router.patch(
            `/doctors/set-password`,
            /* 
                #swagger.tags = ['Doctors']
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
            */
            ValidationMiddleware(DoctorSetPasswordRequestDto),
            AuthMiddleware,
            RoleMiddleware(Role.DOCTOR),
            errorWrapper(this.doctorsController.doctorSetPassword)
        );

        this.router.post(
            `/doctors/announcement`,
            /*
                #swagger.path = '/doctors/announcement'
                #swagger.method = 'post'
                #swagger.tags = ['Doctors']
                #swagger.description = 'Allows doctor to post a nurse hiring announcement'
                #swagger.parameters['body'] = {
                    in: 'body',
                    description: 'Announcement data',
                    required: true,
                    schema: {
                        $clinic_id: 'uuid-of-the-clinic',
                        $working_days: [
                            {
                                $day_of_week: 'MONDAY',
                                $start_time: '09:00',
                                $end_time: '17:00'
                            },
                            {
                                $day_of_week: 'TUESDAY',
                                $start_time: '10:00',
                                $end_time: '17:00'
                            }
                        ],
                        gender: 'FEMALE',
                        max_age: 40,
                        years_of_experience: 3,
                        notes: 'Looking for an experienced nurse'
                    }
                }
                #swagger.responses[201] = {
                    description: 'Announcement posted successfully',
                    schema: {
                        messageEn: 'Announcement created successfully',
                        messageAr: 'تم نشر الإعلان بنجاح'
                    }
                }
                #swagger.responses[403] = {
                    description: 'Doctor account not approved (PENDING or REJECTED)'
                }
                #swagger.responses[404] = {
                    description: 'Doctor not found or does not belong to the specified clinic'
                }
            */
            AuthMiddleware,
            ValidationMiddleware(PostAnnouncementDto),
            this.doctorsController.postAnnouncement
        )
    }
}