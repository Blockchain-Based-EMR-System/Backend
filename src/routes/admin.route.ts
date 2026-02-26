import { Router } from 'express';
import { AdminController } from '@/controllers/admin.controller';
import { AddUserFromAdminDto } from '@/dtos/admins.dto';
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
            ValidationMiddleware(AddUserFromAdminDto),
            this.adminController.addDoctor,
        );

        this.router.post(
            '/admin/nurses',
            /* 
                #swagger.tags = ['Admin']
                #swagger.parameters['body'] = {
                    in: 'body',
                    description: 'Nurse data',
                    required: true,
                    schema: {
                        $email: 'nurse@example.com',
                        $name: 'Nurse Jane',
                        $phone: '1234567890',
                        $gender: 'MALE or FEMALE',
                        $date_of_birth: '1995-06-15',
                        years_of_experience: 3
                    }
                }
                #swagger.parameters['Authorization'] = {
                    in: 'header',
                    description: 'Bearer access token (sent via Authorization cookie)',
                    required: false,
                    type: 'string'
                }
                #swagger.responses[201] = {
                    description: 'Nurse added successfully',
                    schema: {
                        data: {
                            id: '1',
                            email: 'nurse@example.com',
                            name: 'Nurse Jane',
                            role: 'NURSE',
                            username: 'jane',
                            phone: '1234567890',
                            gender: 'FEMALE',
                            date_of_birth: '1995-06-15',
                            isVerified: true,
                            hasCompletedProfile: false,
                            photo_url: null,
                            nurse: {
                                account_status: 'APPROVED',
                                years_of_experience: 3,
                                brief: null,
                                nationalCardUrl: null,
                                bonusFileUrl: null
                            }
                        },
                        messageEn: 'Nurse account created successfully.',
                        messageAr: '.تم إنشاء حساب الممرض بنجاح'
                    }
                }
            */
            AuthMiddleware,
            RoleMiddleware(Role.ADMIN),
            ValidationMiddleware(AddUserFromAdminDto),
            this.adminController.addNurse,
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
                        photoUrl: null,
                        doctor: { 
                        specialization: {key: 'CARDIOLOGY' , value: 'Cardiology'} , avg_time: null , account_status: 'APPROVED',
                        mastersCertificateUrl: '', graduationCertificateUrl: '', fellowshipCertificateUrl: '', professionalPracticeCardUrl: '', membershipCardUrl: '', unionSpecializationCertificateUrl: ''
                        }}] ,
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
            '/admin/nurses',
            /* 
                #swagger.tags = ['Admin']
                #swagger.parameters['Authorization'] = {
                    in: 'header',
                    description: 'Bearer access token (sent via Authorization cookie)',
                    required: false,
                    type: 'string'
                }
                #swagger.responses[200] = {
                    description: 'Nurses retrieved successfully',
                    schema: {
                        data: [
                            {
                                id: '1',
                                email: 'nurse@example.com',
                                name: 'Nurse Jane',
                                role: 'NURSE',
                                username: 'jane',
                                phone: '1234567890',
                                gender: 'FEMALE',
                                date_of_birth: '1995-06-15',
                                isVerified: true,
                                hasCompletedProfile: true,
                                photo_url: null,
                                nurse: {
                                    account_status: 'APPROVED',
                                    years_of_experience: 3,
                                    brief: 'Experienced nurse in ICU',
                                    nationalCardUrl: '',
                                    bonusFileUrl: ''
                                }
                            }
                        ],
                        messageEn: 'Nurses retrieved successfully',
                        messageAr: "تم استرجاع بيانات الممرضين بنجاح."
                    }
                }
            */
            AuthMiddleware,
            RoleMiddleware(Role.ADMIN),
            this.adminController.getAllNurses,
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

        this.router.get(
            '/admin/nurses/unverified',
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
                    description: 'Unverified nurses retrieved successfully',
                    schema: {
                        data: [
                            {
                                id: '1',
                                email: 'nurse@example.com',
                                name: 'Nurse Jane',
                                username: 'jane',
                                phone: '1234567890',
                                gender: 'FEMALE',
                                date_of_birth: '1995-06-15',
                                isVerified: false,
                                hasCompletedProfile: false,
                                photo_url: null,
                                nurse: {
                                    account_status: 'PENDING',
                                    years_of_experience: 3,
                                    brief: 'Experienced nurse in ICU',
                                    nationalCardUrl: '',
                                    bonusFileUrl: ''
                                }
                            }
                        ],
                        messageEn: 'Unverified nurses retrieved successfully',
                        messageAr: "تم استرجاع بيانات الممرضين غير المعتمدين بنجاح."
                    }
                }
            */
            AuthMiddleware,
            RoleMiddleware(Role.ADMIN),
            this.adminController.getUnverifiedNurses,
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

        this.router.patch(
            '/admin/nurses/verify/:id',
            /* 
                #swagger.tags = ['Admin']
                #swagger.parameters['id'] = {
                    in: 'path',
                    description: 'Nurse ID',
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
                    description: 'Nurse verification status updated successfully',
                    schema: {
                        messageEn: 'Nurse verification status updated successfully',
                        messageAr: "تم تحديث حالة اعتماد الممرض بنجاح."
                    }
                }
            */
            AuthMiddleware,
            RoleMiddleware(Role.ADMIN),
            this.adminController.updateNurseVerificationStatus,
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
                        photoUrl: null ,
                        doctor: { 
                        specialization: {key: 'CARDIOLOGY' , value: 'Cardiology'} , avg_time: null , account_status: 'APPROVED',
                        mastersCertificateUrl: '', graduationCertificateUrl: '', fellowshipCertificateUrl: '', professionalPracticeCardUrl: '', membershipCardUrl: '', unionSpecializationCertificateUrl: ''
                        } },
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

        this.router.get(
            '/admin/nurses/:id',
            /* 
                #swagger.tags = ['Admin']
                #swagger.parameters['id'] = {
                    in: 'path',
                    description: 'Nurse ID',
                    required: true,
                    type: 'string'
                }
                #swagger.parameters['Authorization'] = {
                    in: 'header',
                    description: 'Bearer access token (sent via Authorization cookie)',
                    required: false,
                    type: 'string'
                }
                #swagger.responses[200] = {
                    description: 'Nurse retrieved successfully',
                    schema: {
                        data: {
                            id: '1',
                            email: 'nurse@example.com',
                            name: 'Nurse Jane',
                            username: 'jane',
                            phone: '1234567890',
                            gender: 'FEMALE',
                            date_of_birth: '1995-06-15',
                            role: 'NURSE',
                            isVerified: true,
                            hasCompletedProfile: true,
                            photo_url: null,
                            nurse: {
                                account_status: 'APPROVED',
                                years_of_experience: 3,
                                brief: 'Experienced nurse in ICU',
                                nationalCardUrl: '',
                                bonusFileUrl: ''
                            }
                        },
                        messageEn: 'Nurse retrieved successfully',
                        messageAr: "تم استرجاع بيانات الممرض بنجاح."
                    }
                }
                #swagger.responses[404] = {
                    description: 'Nurse not found',
                }
            */
            AuthMiddleware,
            RoleMiddleware(Role.ADMIN),
            this.adminController.getNurseById,
        );

        // Clinic routes
        this.router.get(
            `${this.path}/clinics`,
            /*
                #swagger.path = '/admin/clinics'
                #swagger.method = 'get'
                #swagger.tags = ['Admin']
                #swagger.parameters['Authorization'] = {
                    in: 'cookie',
                    description: 'Bearer token for authentication',
                    required: true,
                    type: 'string'
                }
                #swagger.responses[200] = {
                    description: 'Get clinics successful',
                    schema: {
                        data: [
                            {
                                id: 'clinic-uuid',
                                name: 'Clinic Name',
                                is_active: false,   
                                opening_at: '08:00',
                                closing_at: '16:00',
                                address: '123 Main St, City, Country',
                                address_maps_link: 'https://maps.google.com/?q=123+Main+St,+City,+Country',
                                phone: '1234567890',
                                canPayOnline: true
                            }
                        ],
                        messageEn: 'Clinics retrieved successfully',
                        messageAr: "تم استرجاع بيانات العيادات بنجاح."
                    }
                }
            */
            AuthMiddleware,
            RoleMiddleware(Role.ADMIN),
            this.adminController.getAllClinics
        );
        this.router.get(
            `${this.path}/clinics/:id`,
            /*
                #swagger.path = '/admin/clinics/{id}'
                #swagger.method = 'get'
                #swagger.tags = ['Admin']
                #swagger.parameters['Authorization'] = {
                    in: 'cookie',
                    description: 'Bearer token for authentication',
                    required: true,
                    type: 'string'
                }
                #swagger.parameters['id'] = {
                    in: 'path',
                    description: 'The unique identifier of the clinic to retrieve',
                    required: true,
                    type: 'string'
                }
                #swagger.responses[200] = {
                    description: 'Clinic retrieved successfully',
                    schema: {
                        data: {
                            id: 'clinic-uuid',
                            name: 'Clinic Name',
                            is_active: false,   
                            opening_at: '08:00',
                            closing_at: '16:00',
                            address: '123 Main St, City, Country',
                            address_maps_link: 'https://maps.google.com/?q=123+Main+St,+City,+Country',
                            phone: '1234567890',
                            canPayOnline: true
                        },
                        messageEn: 'Clinic retrieved successfully',
                        messageAr: "تم استرجاع بيانات العيادة بنجاح."
                    }
                }
            */
            AuthMiddleware,
            RoleMiddleware(Role.ADMIN),
            this.adminController.getClinicById
        );
        this.router.patch(
            `${this.path}/clinics/:id/set-active-status`,
            /*
                #swagger.path = '/admin/clinics/{id}/set-active-status'
                #swagger.method = 'patch'
                #swagger.tags = ['Admin']
                #swagger.parameters['Authorization'] = {
                    in: 'cookie',
                    description: 'Bearer token for authentication',
                    required: true,
                    type: 'string'
                }
                #swagger.parameters['id'] = {
                    in: 'path',
                    description: 'The unique identifier of the clinic to set active status',
                    required: true,
                    type: 'string'
                }
                #swagger.parameters['body'] = {
                    in: 'body',
                    description: 'set active status',
                    required: true,
                    schema: {
                        is_active: true
                    }
                }
                #swagger.responses[200] = {
                    description: 'Clinic active status toggled successfully',
                    schema: {
                        data: {
                            id: 'clinic-uuid',
                            name: 'Clinic Name',
                            is_active: true
                        },
                        messageEn: 'Clinic active status toggled successfully',
                        messageAr: "تم تبديل حالة العيادة بنجاح."
                    }
                }
            */
            AuthMiddleware,
            RoleMiddleware(Role.ADMIN),
            this.adminController.setClinicActiveStatus
        );
    }
}