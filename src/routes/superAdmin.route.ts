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
            `${this.path}/admins`,
            /* #swagger.tags = ['Super Admin']
               #swagger.summary = 'Add a new admin'
               #swagger.description = 'Super admin endpoint to add a new admin to the system'
               #swagger.security = [{ "bearerAuth": [] }, { cookieAuth: [] }]
               #swagger.requestBody = {
                   required: true,
                   content: {
                       "application/json": {
                           schema: {
                               type: "object",
                               required: ["email", "name", "password", "phone", "gender", "date_of_birth"],
                               properties: {
                                   email: { type: "string", format: "email", example: "admin@example.com" },
                                   name: { type: "string", example: "Jane Smith" },
                                   password: { type: "string", format: "password", example: "SecurePass123!" },
                                   phone: { type: "string", example: "+1234567890" },
                                   gender: { type: "string", enum: ["MALE", "FEMALE"], example: "FEMALE" },
                                   date_of_birth: { type: "string", format: "date", example: "1990-01-01" }
                               }
                           }
                       }
                   }
               }
               #swagger.responses[201] = {
                   description: "Admin added successfully",
                   content: {
                       "application/json": {
                           schema: {
                               type: "object",
                               properties: {
                                   data: {
                                       type: "object",
                                       properties: {
                                           email: { type: "string" },
                                           name: { type: "string" },
                                           username: { type: "string" },
                                           phone: { type: "string" },
                                           role: { type: "string" },
                                           gender: { type: "string", enum: ["MALE", "FEMALE"] },
                                           isVerified: { type: "boolean" },
                                           hasCompletedProfile: { type: "boolean" },
                                           date_of_birth: { type: "string", format: "date-time" },
                                           photo_url: { type: "string", nullable: true }
                                       }
                                   },
                                   message: { type: "string", example: "Admin added successfully" }
                               }
                           }
                       }
                   }
               }
               #swagger.responses[400] = { description: "Bad request - Invalid input data" }
               #swagger.responses[401] = { description: "Unauthorized - Invalid or missing token" }
               #swagger.responses[403] = { description: "Forbidden - Insufficient permissions" }
            */
            AuthMiddleware,
            RoleMiddleware(Role.SUPER_ADMIN),
            ValidationMiddleware(AddAdminFromSuperAdminDto),
            this.superAdminController.addAdmin,
        );
        
        this.router.get(
            `${this.path}/admins`,
            /* #swagger.tags = ['Super Admin']
               #swagger.summary = 'Get all admins'
               #swagger.description = 'Retrieve a list of all admins in the system'
               #swagger.security = [{ "bearerAuth": [] }, { cookieAuth: [] }]
               #swagger.responses[200] = {
                   description: "Admins retrieved successfully",
                   content: {
                       "application/json": {
                           schema: {
                               type: "object",
                               properties: {
                                   data: {
                                       type: "array",
                                       items: {
                                           type: "object",
                                           properties: {
                                               email: { type: "string" },
                                               name: { type: "string" },
                                               username: { type: "string" },
                                               phone: { type: "string" },
                                               role: { type: "string" },
                                               gender: { type: "string", enum: ["MALE", "FEMALE"] },
                                               isVerified: { type: "boolean" },
                                               hasCompletedProfile: { type: "boolean" },
                                               date_of_birth: { type: "string", format: "date-time" },
                                               photo_url: { type: "string", nullable: true }
                                           }
                                       }
                                   },
                                   message: { type: "string", example: "Admins retrieved successfully" }
                               }
                           }
                       }
                   }
               }
               #swagger.responses[401] = { description: "Unauthorized - Invalid or missing token" }
               #swagger.responses[403] = { description: "Forbidden - Insufficient permissions" }
            */
            AuthMiddleware,
            RoleMiddleware(Role.SUPER_ADMIN),
            this.superAdminController.getAllAdmins,
        );

        this.router.get(
            `${this.path}/admins/:id`,
            /* #swagger.tags = ['Super Admin']
               #swagger.summary = 'Get admin by ID'
               #swagger.description = 'Retrieve a specific admin\'s details by their ID'
               #swagger.security = [{ "bearerAuth": [] }, { cookieAuth: [] }]
               #swagger.parameters['id'] = {
                   in: 'path',
                   description: 'Admin ID',
                   required: true,
                   type: 'string'
               }
               #swagger.responses[200] = {
                   description: "Admin retrieved successfully",
                   content: {
                       "application/json": {
                           schema: {
                               type: "object",
                               properties: {
                                   data: {
                                       type: "object",
                                       properties: {
                                           email: { type: "string" },
                                           name: { type: "string" },
                                           username: { type: "string" },
                                           phone: { type: "string" },
                                           role: { type: "string" },
                                           gender: { type: "string", enum: ["MALE", "FEMALE"] },
                                           isVerified: { type: "boolean" },
                                           hasCompletedProfile: { type: "boolean" },
                                           date_of_birth: { type: "string", format: "date-time" },
                                           photo_url: { type: "string", nullable: true }
                                       }
                                   },
                                   message: { type: "string", example: "Admin retrieved successfully" }
                               }
                           }
                       }
                   }
               }
               #swagger.responses[401] = { description: "Unauthorized - Invalid or missing token" }
               #swagger.responses[403] = { description: "Forbidden - Insufficient permissions" }
               #swagger.responses[404] = { description: "Admin not found" }
            */
            AuthMiddleware,
            RoleMiddleware(Role.SUPER_ADMIN),
            this.superAdminController.getAdminById,
        )

        // DOCTOR ROUTES
        this.router.post(
            `${this.path}/doctors`,
            /* #swagger.tags = ['Super Admin']
               #swagger.summary = 'Add a new doctor'
               #swagger.description = 'Super admin endpoint to add a new doctor to the system'
               #swagger.security = [{ "bearerAuth": [] }, { cookieAuth: [] }]
               #swagger.requestBody = {
                   required: true,
                   content: {
                       "application/json": {
                           schema: {
                               type: "object",
                               required: ["email", "name", "phone", "gender", "specialization"],
                               properties: {
                                   email: { type: "string", format: "email", example: "doctor@example.com" },
                                   name: { type: "string", example: "John Doe" },
                                   phone: { type: "string", example: "+1234567890" },
                                   gender: { type: "string", enum: ["MALE", "FEMALE"], example: "MALE" },
                                   specialization: { type: "string", example: "CARDIOLOGY" }
                               }
                           }
                       }
                   }
               }
               #swagger.responses[201] = {
                   description: "Doctor added successfully",
                   content: {
                       "application/json": {
                           schema: {
                               type: "object",
                               properties: {
                                   data: {
                                       type: "object",
                                       properties: {
                                           email: { type: "string" },
                                           name: { type: "string" },
                                           username: { type: "string" },
                                           phone: { type: "string" },
                                           gender: { type: "string" },
                                           role: { type: "string" },
                                           date_of_birth: { type: "string", format: "date-time" },
                                           isVerified: { type: "boolean" },
                                           hasCompletedProfile: { type: "boolean" },
                                           photoUrl: { type: "string", nullable: true },
                                           doctor: {
                                               type: "object",
                                               nullable: true,
                                               properties: {
                                                   specialization: { 
                                                       type: "object",
                                                       properties: {
                                                           key: { type: "string" },
                                                           value: { type: "string" }
                                                       }
                                                   },
                                                   avg_time: { type: "number", nullable: true }
                                               }
                                           }
                                       }
                                   },
                                   message: { type: "string", example: "Doctor added successfully" }
                               }
                           }
                       }
                   }
               }
               #swagger.responses[400] = { description: "Bad request - Invalid input data" }
               #swagger.responses[401] = { description: "Unauthorized - Invalid or missing token" }
               #swagger.responses[403] = { description: "Forbidden - Insufficient permissions" }
            */
            AuthMiddleware,
            RoleMiddleware(Role.SUPER_ADMIN),
            LanguageMiddleware,
            ValidationMiddleware(AddDoctorFromAdminDto),
            this.adminController.addDoctor,
        );

        this.router.get(
            `${this.path}/doctors`,
            /* #swagger.tags = ['Super Admin']
               #swagger.summary = 'Get all doctors'
               #swagger.description = 'Retrieve a list of all doctors in the system'
               #swagger.security = [{ "bearerAuth": [] }, { cookieAuth: [] }]
               #swagger.parameters['accept-language'] = {
                   in: 'header',
                   description: 'Language preference (en or ar)',
                   required: false,
                   type: 'string',
                   example: 'en'
               }
               #swagger.responses[200] = {
                   description: "Doctors retrieved successfully",
                   content: {
                       "application/json": {
                           schema: {
                               type: "object",
                               properties: {
                                   data: {
                                       type: "array",
                                       items: {
                                           type: "object",
                                           properties: {
                                               name: { type: "string" },
                                               email: { type: "string" },
                                               username: { type: "string" },
                                               phone: { type: "string" },
                                               gender: { type: "string", enum: ["MALE", "FEMALE"] },
                                               date_of_birth: { type: "string", format: "date-time" },
                                               role: { type: "string" },
                                               isVerified: { type: "boolean" },
                                               hasCompletedProfile: { type: "boolean" },
                                               photo_url: { type: "string", nullable: true },
                                               doctor: {
                                                   type: "object",
                                                   nullable: true,
                                                   properties: {
                                                       specialization: { 
                                                           type: "object",
                                                           properties: {
                                                               key: { type: "string" },
                                                               value: { type: "string" }
                                                           }
                                                       },
                                                       avg_time: { type: "number", nullable: true }
                                                   }
                                               }
                                           }
                                       }
                                   },
                                   message: { type: "string", example: "Doctors retrieved successfully" }
                               }
                           }
                       }
                   }
               }
               #swagger.responses[401] = { description: "Unauthorized - Invalid or missing token" }
               #swagger.responses[403] = { description: "Forbidden - Insufficient permissions" }
            */
            AuthMiddleware,
            RoleMiddleware(Role.SUPER_ADMIN),
            LanguageMiddleware,
            this.adminController.getAllDoctors,
        );

        this.router.get(
            `${this.path}/doctors/:id`,
            /* #swagger.tags = ['Super Admin']
               #swagger.summary = 'Get doctor by ID'
               #swagger.description = 'Retrieve a specific doctor\'s details by their ID'
               #swagger.security = [{ "bearerAuth": [] }, { cookieAuth: [] }]
               #swagger.parameters['id'] = {
                   in: 'path',
                   description: 'Doctor ID',
                   required: true,
                   type: 'string'
               }
               #swagger.parameters['accept-language'] = {
                   in: 'header',
                   description: 'Language preference (en or ar)',
                   required: false,
                   type: 'string',
                   example: 'en'
               }
               #swagger.responses[200] = {
                   description: "Doctor retrieved successfully",
                   content: {
                       "application/json": {
                           schema: {
                               type: "object",
                               properties: {
                                   data: {
                                       type: "object",
                                       properties: {
                                           name: { type: "string" },
                                           email: { type: "string" },
                                           username: { type: "string" },
                                           phone: { type: "string" },
                                           gender: { type: "string", enum: ["MALE", "FEMALE"] },
                                           date_of_birth: { type: "string", format: "date-time" },
                                           role: { type: "string" },
                                           isVerified: { type: "boolean" },
                                           hasCompletedProfile: { type: "boolean" },
                                           photo_url: { type: "string", nullable: true },
                                           doctor: {
                                               type: "object",
                                               nullable: true,
                                               properties: {
                                                   specialization: { 
                                                       type: "object",
                                                       properties: {
                                                           key: { type: "string" },
                                                           value: { type: "string" }
                                                       }
                                                   },
                                                   avg_time: { type: "number", nullable: true }
                                               }
                                           }
                                       }
                                   },
                                   message: { type: "string", example: "Doctor retrieved successfully" }
                               }
                           }
                       }
                   }
               }
               #swagger.responses[401] = { description: "Unauthorized - Invalid or missing token" }
               #swagger.responses[403] = { description: "Forbidden - Insufficient permissions" }
               #swagger.responses[404] = { description: "Doctor not found" }
            */
            AuthMiddleware,
            RoleMiddleware(Role.SUPER_ADMIN),
            LanguageMiddleware,
            this.adminController.getDoctorById,
        )
    }
}