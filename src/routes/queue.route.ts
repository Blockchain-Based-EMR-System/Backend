import { Routes } from "@/interfaces";
import { Router } from "express";
import { QueueController } from "@/controllers/queue.controller";
import { AuthMiddleware } from "@/middlewares/auth.middleware";


export class QueueRoute implements Routes {
    public path = '/queue';
    public router = Router();
    public queueController = new QueueController();

    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.get(
            `${this.path}/position/:appointmentId`,
            AuthMiddleware,
            this.queueController.getQueuePosition
        );
    }
}