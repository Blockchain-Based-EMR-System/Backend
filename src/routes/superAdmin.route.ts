import { SuperAdminController } from "@/controllers/superAdmin.controller";
import { AddAdminFromSuperAdminDto } from "@/dtos/superAdmins.dto";
import { Routes } from "@/interfaces";
import { ValidationMiddleware } from "@/middlewares/validation.middleware";
import { Router } from "express";


export class SuperAdminRoute implements Routes {
    public path = '/super-admin';
    public router = Router();
    public superAdminController = new SuperAdminController();

    constructor() {
        this.initializeRoutes();
    }
    private initializeRoutes() {
        this.router.post(
            `${this.path}/admins`,
            /* #swagger.tags = ['Super Admin'] */
            // AuthMiddleware,
            // RoleMiddleware(Role.SUPER_ADMIN),
            // LanguageMiddleware,
            ValidationMiddleware(AddAdminFromSuperAdminDto),
            this.superAdminController.addAdmin,
        );
    }
}