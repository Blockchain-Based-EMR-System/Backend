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
            /* 
                #swagger.path = '/queue/position/{appointmentId}'
                #swagger.method = 'get'
                #swagger.tags = ['Queue']
                #swagger.parameters['appointmentId'] = {
                    in: 'path',
                    description: 'Appointment ID to get its queue position',
                    required: true,
                    type: 'string'
                }
                #swagger.parameters['Authorization'] = {
                    in: 'cookie',
                    description: 'Bearer token for authentication',
                    required: true,
                    type: 'string'
                }
                #swagger.description = 'Get queue position, number of patients ahead, and estimated waiting time for a specific appointment'
                #swagger.responses[200] = {
                    description: 'Queue position retrieved successfully',
                    schema: {
                        data: {
                            position: 3,
                            patientsAhead: 2,
                            estimatedWaitMinutes: 60
                        },
                        message: 'Queue position retrieved successfully',
                    }
                }
                #swagger.responses[400] = {
                    description: 'Appointment ID is required'
                }
                #swagger.responses[404] = {
                    description: 'Appointment not found or doctor not working on this day'
                }
                #swagger.responses[401] = {
                    description: 'Unauthorized'
                }
            */

            AuthMiddleware,
            this.queueController.getQueuePosition
        );
    }
}