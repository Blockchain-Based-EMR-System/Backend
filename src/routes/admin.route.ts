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
            /* #swagger.tags = ['Admin'] */
            AuthMiddleware,
            RoleMiddleware(Role.ADMIN),
            LanguageMiddleware,
            ValidationMiddleware(AddDoctorFromAdminDto),
            this.adminController.addDoctor,
        );

        this.router.get(
            `${this.path}/doctors`,
            /* #swagger.tags = ['Admin'] */
            AuthMiddleware,
            RoleMiddleware(Role.ADMIN),
            LanguageMiddleware,
            this.adminController.getAllDoctors,
        );

        this.router.get(
            `${this.path}/doctors/:id`,
            /* #swagger.tags = ['Admin'] */
            AuthMiddleware,
            RoleMiddleware(Role.ADMIN),
            LanguageMiddleware,
            this.adminController.getDoctorById,
        );
    }
}