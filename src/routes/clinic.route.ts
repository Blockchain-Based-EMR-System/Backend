import { ClinicController } from "@/controllers/clinic.controller";
import {  CreateUpdateClinicRequestDto } from "@/dtos/clinics.dto";
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
            ValidationMiddleware(CreateUpdateClinicRequestDto),
            this.clinicController.createClinic
        );

        this.router.get(
            `${this.path}/:id`,
            AuthMiddleware, // To be Discussed: Should patients be able to view clinic details?
            this.clinicController.createClinic
        );

        this.router.patch(
            `${this.path}/:id`,
            AuthMiddleware,
            RoleMiddleware(Role.DOCTOR),
            ValidationMiddleware(CreateUpdateClinicRequestDto, true),
            this.clinicController.updateClinicById
        );

        this.router.delete(
            `${this.path}/:id`,
            AuthMiddleware,
            RoleMiddleware(Role.DOCTOR),
            this.clinicController.deleteClinicById
        );
    }
}