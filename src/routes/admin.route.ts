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
            `${this.path}/doctors`,
            /* #swagger.tags = ['Admin']
               #swagger.summary = 'Add a new doctor'
               #swagger.description = 'Admin endpoint to add a new doctor to the system'
               #swagger.security = [{ "bearerAuth": []} ,{ cookieAuth: []}]
               #swagger.requestBody = {
                   required: true,
                   content: {
                       "application/json": {
                           schema: {
                               type: "object",
                               required: ["email", "name", "phone", "gender","specialization"],
                               properties: {
                                   email: { type: "string", format: "email", example: "doctor@example.com" },
                                   name: { type: "string", example: "John" },
                                   phone: { type: "string", example: "+1234567890" },
                                   gender: { type: "string", enum: ["MALE", "FEMALE"] },
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
                                           gender: { type: "string", enum: ["MALE", "FEMALE"] },
                                           role: { type: "string" },
                                           date_of_birth: { type: "string", format: "date-time"},
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
            RoleMiddleware(Role.ADMIN),
            LanguageMiddleware,
            ValidationMiddleware(AddDoctorFromAdminDto),
            this.adminController.addDoctor,
        );

        this.router.get(
            `${this.path}/doctors`,
            /* #swagger.tags = ['Admin']
               #swagger.summary = 'Get all doctors'
               #swagger.description = 'Retrieve a list of all doctors in the system'
               #swagger.security = [{ "bearerAuth": [] } , { cookieAuth: [] }]
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
            RoleMiddleware(Role.ADMIN),
            LanguageMiddleware,
            this.adminController.getAllDoctors,
        );

        this.router.get(
            `${this.path}/doctors/:id`,
            /* #swagger.tags = ['Admin']
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
            RoleMiddleware(Role.ADMIN),
            LanguageMiddleware,
            this.adminController.getDoctorById,
        );

        this.router.patch(
            `${this.path}/doctors/:id`,
            /* #swagger.tags = ['Admin'] */
            AuthMiddleware,
            RoleMiddleware(Role.ADMIN),
            this.adminController.updateDoctorVerificationStatus,
        );
    }
}