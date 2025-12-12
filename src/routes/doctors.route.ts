import { DoctorController } from "@/controllers/doctor.controller";
import { DoctorSignupRequestDto } from "@/dtos/doctors.dto";
import { Routes } from "@/interfaces";
import { ValidationMiddleware } from "@/middlewares/validation.middleware";
import { Router } from "express";


export class DoctorsRoute implements Routes {
    public path = '/doctors'
    public router = Router();
    public doctorsController = new DoctorController();
    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.post(
            `/doctors/signup`,
            ValidationMiddleware(DoctorSignupRequestDto),
            this.doctorsController.doctorSignup
        );
    }
}