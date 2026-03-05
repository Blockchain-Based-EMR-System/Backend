import { AiAppointmentsController } from "@/controllers/ai_appointments.controller";
import { Routes } from "@/interfaces";
import { AuthMiddleware } from "@/middlewares/auth.middleware";
import { Router } from "express";

export class AiAppointmentsRoute implements Routes {
    public path: string = ""
    public router: Router = Router()
    private aiAppointmentsController = new AiAppointmentsController();

    constructor() {
        this.initializeRoutes()
    };

    private initializeRoutes(): void {
        this.router.get(`${this.path}/:appointmentId/upload-url`,
            // AuthMiddleware,
            this.aiAppointmentsController.getUploadUrl
        )

        this.router.post(`${this.path}/:appointmentId/process-audio-ai`,
            // AuthMiddleware,
            this.aiAppointmentsController.processAudioAI
        )
    }
}