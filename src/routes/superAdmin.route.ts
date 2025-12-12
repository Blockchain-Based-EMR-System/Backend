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
                    description: 'Bearer access token (sent via Authorization cookie or Authorization header)',
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
                        message: 'Admin added successfully'
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
                    description: 'Bearer access token (sent via Authorization cookie or Authorization header)',
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
                        message: 'Admins retrieved successfully'
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
                    description: 'Bearer access token (sent via Authorization cookie or Authorization header)',
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
                        message: 'Admin retrieved successfully'
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
                        $specialization: 'CARDIOLOGY or امراض القلب or Cardiology'
                    }
                }
                #swagger.parameters['Authorization'] = {
                    in: 'header',
                    description: 'Bearer access token (sent via Authorization cookie or Authorization header)',
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
                        message: 'Doctor added successfully'
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
                    description: 'Bearer access token (sent via Authorization cookie or Authorization header)',
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
                        doctor: { specialization: {key: 'CARDIOLOGY' , value: 'Cardiology'} , avg_time: null }, photoUrl: null }],
                        message: 'Doctors retrieved successfully'
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
                    description: 'Bearer access token (sent via Authorization cookie or Authorization header)',
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
                        doctor: { specialization: {key: 'CARDIOLOGY' , value: 'Cardiology'} , avg_time: null }, photoUrl: null },
                        message: 'Doctor retrieved successfully'
                    }
                }
            */
            AuthMiddleware,
            RoleMiddleware(Role.SUPER_ADMIN),
            LanguageMiddleware,
            this.adminController.getDoctorById,
        )
    }
}