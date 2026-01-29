import { Router } from 'express';
import { AdminController } from '@/controllers/admin.controller';
import { AddDoctorFromAdminDto } from '@/dtos/admins.dto';
import { Routes } from '@/interfaces';
import { AuthMiddleware, RoleMiddleware } from '@/middlewares/auth.middleware';
import { LanguageMiddleware } from '@/middlewares/language.middleware';
import { ValidationMiddleware } from '@/middlewares/validation.middleware';
import { Role } from '@prisma/client';

export class AdminRoute implements Routes {
    public path = '/admin';
    public router = Router();
    public adminController = new AdminController();

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.post(
            '/admin/doctors',
            /* 
                #swagger.tags = ['Admin']
                #swagger.parameters['body'] = {
                    in: 'body',
                    description: 'Doctor data',
                    required: true,
                    schema: {
                        $email: 'doctor@example.com',
                        $name: 'Dr. Smith',
                        $phone: '1234567890',
                        $gender: 'MALE or FEMALE',
                        $date_of_birth: '1990-01-01',
                    }
                }
                #swagger.parameters['Authorization'] = {
                    in: 'header',
                    description: 'Bearer access token (sent via Authorization cookie)',
                    required: false,
                    type: 'string'
                }
                #swagger.parameters['accept-language'] = {
                    in: 'header',
                    description: 'Language preference (en or ar)',
                    required: false,
                    type: 'string'
                }
                #swagger.responses[201] = {
                    description: 'Doctor added successfully',
                    schema: {
                        data: { email: 'doctor@example.com', name: 'Dr. Smith', role: 'DOCTOR', 
                        username: 'smith', phone : '1234567890', gender: 'MALE', isVerified: false, hasCompletedProfile: false,
                        doctor: { specialization: {key: 'CARDIOLOGY' , value: 'Cardiology'} , avg_time: null, account_status: 'PENDING' }, photoUrl: null },
                        messageEn: "Doctor account created successfully.",
                        messageAr: ".تم إنشاء حساب الطبيب بنجاح"
                    }
                }
            */
            AuthMiddleware,
            RoleMiddleware(Role.ADMIN),
            LanguageMiddleware,
            ValidationMiddleware(AddDoctorFromAdminDto),
            this.adminController.addDoctor,
        );

        this.router.get(
            '/admin/doctors',
            /* 
                #swagger.tags = ['Admin']
                #swagger.parameters['Authorization'] = {
                    in: 'header',
                    description: 'Bearer access token (sent via Authorization cookie)',
                    required: false,
                    type: 'string'
                }
                #swagger.parameters['accept-language'] = {
                    in: 'header',
                    description: 'Language preference (en or ar)',
                    required: false,
                    type: 'string'
                }
                #swagger.responses[200] = {
                    description: 'Doctors retrieved successfully',
                    schema: {
                        data:[ { id: '1' , email: 'doctor@example.com', name: 'Dr. Smith', role: 'DOCTOR', 
                        username: 'smith', phone : '1234567890', gender: 'MALE', isVerified: false, hasCompletedProfile: false,
                        doctor: { specialization: {key: 'CARDIOLOGY' , value: 'Cardiology'} , avg_time: null , account_status: 'APPROVED' }, photoUrl: null }],
                        messageEn: 'Doctors retrieved successfully',
                        messageAr: "تم استرجاع بيانات الأطباء بنجاح."
                    }
                }
            */
            AuthMiddleware,
            RoleMiddleware(Role.ADMIN),
            LanguageMiddleware,
            this.adminController.getAllDoctors,
        );

        this.router.get(
            '/admin/doctors/unverified',
            /* 
                #swagger.tags = ['Admin']
                #swagger.parameters['Authorization'] = {
                    in: 'header',
                    description: 'Bearer access token (sent via Authorization cookie)',
                    required: false,
                    type: 'string'
                }
                #swagger.parameters['accept-language'] = {
                    in: 'header',
                    description: 'Language preference (en or ar)',
                    required: false,
                    type: 'string'
                }
                #swagger.responses[200] = {
                    description: 'Unverified doctors retrieved successfully',
                    schema: {
                        data:[ { id: '1' , email: 'doctor@example.com', name: 'Dr. Smith', 
                        username: 'smith', phone : '1234567890', gender: 'MALE', isVerified: false, date_of_birth: '1990-01-01', photoUrl: null,
                        doctor: { 
                        specialization: {key: 'CARDIOLOGY' , value: 'Cardiology'} , avg_time: null , account_status: 'APPROVED',
                        mastersCertificateUrl: '', graduationCertificateUrl: '', fellowshipCertificateUrl: '', professionalPracticeCardUrl: '', membershipCardUrl: '', unionSpecializationCertificateUrl: ''
                        } 
                        }
                        ],
                        messageEn: 'Unverified doctors retrieved successfully',
                        messageAr: "تم استرجاع بيانات الأطباء غير المعتمدين بنجاح."
                    }
                }
            */
            AuthMiddleware,
            RoleMiddleware(Role.ADMIN),
            LanguageMiddleware,
            this.adminController.getUnverifiedDoctors,
        );

        this.router.patch(
            '/admin/doctors/verify/:id',
            /* 
                #swagger.tags = ['Admin']
                #swagger.parameters['id'] = {
                    in: 'path',
                    description: 'Doctor ID',
                    required: true,
                    type: 'string'
                }
                #swagger.parameters['body'] = {
                    in: 'body',
                    description: 'Verification status',
                    required: true,
                    schema: {
                        $isApproved: true
                    }
                }
                #swagger.parameters['Authorization'] = {
                    in: 'header',
                    description: 'Bearer access token (sent via Authorization cookie or Authorization header)',
                    required: false,
                    type: 'string'
                }
                #swagger.responses[200] = {
                    description: 'Doctor verification status updated successfully',
                    schema: {
                        messageEn: 'Doctor verification status updated successfully',
                        messageAr: "تم تحديث حالة اعتماد الطبيب بنجاح."
                    }
                }
            */
            AuthMiddleware,
            RoleMiddleware(Role.ADMIN),
            this.adminController.updateDoctorVerificationStatus,
        );

        this.router.get(
            '/admin/doctors/:id',
            /* 
                #swagger.tags = ['Admin']
                #swagger.parameters['id'] = {
                    in: 'path',
                    description: 'Doctor ID',
                    required: true,
                    type: 'string'
                }
                #swagger.parameters['Authorization'] = {
                    in: 'header',
                    description: 'Bearer access token (sent via Authorization cookie)',
                    required: false,
                    type: 'string'
                }
                #swagger.parameters['accept-language'] = {
                    in: 'header',
                    description: 'Language preference (en or ar)',
                    required: false,
                    type: 'string'
                }
                #swagger.responses[200] = {
                    description: 'Doctor retrieved successfully',
                    schema: {
                        data: { email: 'doctor@example.com', name: 'Dr. Smith', role: 'DOCTOR', 
                        username: 'smith', phone : '1234567890', gender: 'MALE', isVerified: false, hasCompletedProfile: false,
                        doctor: { specialization: {key: 'CARDIOLOGY' , value: 'Cardiology'} , avg_time: null, account_status: 'APPROVED' }, photoUrl: null },
                        messageEn: 'Doctor retrieved successfully',
                        messageAr: "تم استرجاع بيانات الطبيب بنجاح."
                    }
                }
            */
            AuthMiddleware,
            RoleMiddleware(Role.ADMIN),
            LanguageMiddleware,
            this.adminController.getDoctorById,
        );
    }
}