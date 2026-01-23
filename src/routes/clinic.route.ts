import { ClinicController } from "@/controllers/clinic.controller";
import { CreateClinicRequestDto } from "@/dtos/clinics.dto";
import { Routes } from "@/interfaces";
import { AuthMiddleware, RoleMiddleware } from "@/middlewares/auth.middleware";
import { ValidationMiddleware } from "@/middlewares/validation.middleware";
import { Role } from "@prisma/client";
import { Router } from "express";

export class ClinicRoute implements Routes {
    public path = '/clinics'
    public router = Router();
    public clinicController = new ClinicController();
    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.post(
            `${this.path}`,
            AuthMiddleware,
            RoleMiddleware(Role.DOCTOR),
            ValidationMiddleware(CreateClinicRequestDto),
            this.clinicController.createClinic
        );
    }
}