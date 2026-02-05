import { AdminController } from "@/controllers/admin.controller";
import { SuperAdminController } from "@/controllers/superAdmin.controller";
import { AddDoctorFromAdminDto } from "@/dtos/admins.dto";
import { AddAdminFromSuperAdminDto } from "@/dtos/superAdmins.dto";
import { Routes } from "@/interfaces";
import { AuthMiddleware, RoleMiddleware } from "@/middlewares/auth.middleware";
import { LanguageMiddleware } from "@/middlewares/language.middleware";
import { ValidationMiddleware } from "@/middlewares/validation.middleware";
import { Role } from "@prisma/client";
import { Router } from "express";


export class SuperAdminRoute implements Routes {
    public path = '/super-admin';
    public router = Router();
    public superAdminController = new SuperAdminController();
    public adminController = new AdminController();

    constructor() {
        this.initializeRoutes();
    }
    private initializeRoutes() {

        // ADMIN ROUTES
        this.router.post(
            '/super-admin/admins',
            /* 
                #swagger.tags = ['Super Admin']
                #swagger.parameters['body'] = {
                    in: 'body',
                    description: 'Admin data',
                    required: true,
                    schema: {
                        $email: 'admin@example.com',
                        $name: 'Jane Smith',
                        $password: 'SecurePass123!',
                        $phone: '1234567890',
                        $gender: 'MALE or FEMALE',
                        $date_of_birth: '1990-01-01'
                    }
                }
                #swagger.parameters['Authorization'] = {
                    in: 'header',
                    description: 'Bearer access token (sent via Authorization cookie)',
                    required: false,
                    type: 'string'
                }
                #swagger.responses[201] = {
                    description: 'Admin added successfully',
                    schema: {
                        data: {
                            email: 'admin@example.com',
                            name: 'Jane Smith',
                            role: 'ADMIN',
                            username: 'janesmith',
                            phone: '1234567890',
                            gender: 'FEMALE',
                            date_of_birth: '1990-01-01T00:00:00.000Z',
                            photo_url: null,
                            isVerified: true,
                            hasCompletedProfile: true
                        },
                        messageEn: 'Admin added successfully',
                        messageAr: "تم إضافة المسؤول بنجاح"
                    }
                }
            */
            AuthMiddleware,
            RoleMiddleware(Role.SUPER_ADMIN),
            ValidationMiddleware(AddAdminFromSuperAdminDto),
            this.superAdminController.addAdmin,
        );

        this.router.get(
            '/super-admin/admins',
            /* 
                #swagger.tags = ['Super Admin']
                #swagger.parameters['Authorization'] = {
                    in: 'header',
                    description: 'Bearer access token (sent via Authorization cookie)',
                    required: false,
                    type: 'string'
                }
                #swagger.responses[200] = {
                    description: 'Admins retrieved successfully',
                    schema: {
                        data: [{
                            id: '1',
                            email: 'admin@example.com',
                            name: 'Jane Smith',
                            role: 'ADMIN',
                            username: 'janesmith',
                            phone: '1234567890',
                            gender: 'FEMALE',
                            date_of_birth: '1990-01-01T00:00:00.000Z',
                            photo_url: null,
                            isVerified: true,
                            hasCompletedProfile: true
                        }],
                        messageEn: 'Admins retrieved successfully',
                        messageAr: "تم استرجاع المسؤولين بنجاح"
                    }
                }
            */
            AuthMiddleware,
            RoleMiddleware(Role.SUPER_ADMIN),
            this.superAdminController.getAllAdmins,
        );

        this.router.get(
            '/super-admin/admins/:id',
            /* 
                #swagger.tags = ['Super Admin']
                #swagger.parameters['id'] = {
                    in: 'path',
                    description: 'Admin ID',
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
                    description: 'Admin retrieved successfully',
                    schema: {
                        data: {
                            email: 'admin@example.com',
                            name: 'Jane Smith',
                            role: 'ADMIN',
                            username: 'janesmith',
                            phone: '1234567890',
                            gender: 'FEMALE',
                            date_of_birth: '1990-01-01T00:00:00.000Z',
                            photo_url: null,
                            isVerified: true,
                            hasCompletedProfile: true
                        },
                        messageEn: 'Admin retrieved successfully',
                        messageAr: "تم استرجاع المسؤول بنجاح"
                    }
                }
            */
            AuthMiddleware,
            RoleMiddleware(Role.SUPER_ADMIN),
            this.superAdminController.getAdminById,
        )

        // DOCTOR ROUTES
        this.router.post(
            '/super-admin/doctors',
            /* 
                #swagger.tags = ['Super Admin']
                #swagger.parameters['body'] = {
                    in: 'body',
                    description: 'Doctor data',
                    required: true,
                    schema: {
                        $email: 'doctor@example.com',
                        $name: 'Dr. John Doe',
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
                        doctor: { specialization: {key: 'CARDIOLOGY' , value: 'Cardiology'} , avg_time: null }, photoUrl: null },
                        messageEn: 'Doctor added successfully',
                        messageAr: "تم إضافة الطبيب بنجاح"
                    }
                }
            */
            AuthMiddleware,
            RoleMiddleware(Role.SUPER_ADMIN),
            LanguageMiddleware,
            ValidationMiddleware(AddDoctorFromAdminDto),
            this.adminController.addDoctor,
        );

        this.router.get(
            '/super-admin/doctors',
            /* 
                #swagger.tags = ['Super Admin']
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
                        data: [{ id: '1', email: 'doctor@example.com', name: 'Dr. Smith', role: 'DOCTOR', 
                        username: 'smith', phone : '1234567890', gender: 'MALE', isVerified: false, hasCompletedProfile: false,
                        photoUrl: null ,
                        doctor: { 
                        specialization: {key: 'CARDIOLOGY' , value: 'Cardiology'} , avg_time: null , account_status: 'APPROVED',
                        mastersCertificateUrl: '', graduationCertificateUrl: '', fellowshipCertificateUrl: '', professionalPracticeCardUrl: '', membershipCardUrl: '', unionSpecializationCertificateUrl: ''
                        }}],
                        messageEn: 'Doctors retrieved successfully',
                        messageAr: "تم استرجاع الأطباء بنجاح"
                    }
                }
            */
            AuthMiddleware,
            RoleMiddleware(Role.SUPER_ADMIN),
            LanguageMiddleware,
            this.adminController.getAllDoctors,
        );

        this.router.get(
            '/super-admin/doctors/:id',
            /* 
                #swagger.tags = ['Super Admin']
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
                        messageAr: "تم استرجاع الطبيب بنجاح"
                    }
                }
            */
            AuthMiddleware,
            RoleMiddleware(Role.SUPER_ADMIN),
            LanguageMiddleware,
            this.adminController.getDoctorById,
        )

        // CLINIC ROUTES
        this.router.get(
            '/super-admin/clinics',
            /* 
                #swagger.tags = ['Super Admin']
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
            RoleMiddleware(Role.SUPER_ADMIN),
            this.adminController.getAllClinics,
        );
        this.router.get(
            '/super-admin/clinics/:id',
            /*
                #swagger.tags = ['Super Admin']
                #swagger.parameters['id'] = {
                    in: 'path',
                    description: 'Clinic ID',
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
            RoleMiddleware(Role.SUPER_ADMIN),
            this.adminController.getClinicById,
        );
    }
}