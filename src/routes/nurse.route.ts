import { Routes } from "@/interfaces";
import { ValidationMiddleware } from "@/middlewares/validation.middleware";
import { Router } from "express";
import { errorWrapper } from "@/utils/errorWrapper";
import { AuthMiddleware, RoleMiddleware } from "@/middlewares/auth.middleware";
import { Role } from "@prisma/client";
import { uploadPdf } from "@/middlewares/multer.middleware";

export class NurseRoute implements Routes {
    public path = '/nurses'
    public router = Router();
    constructor() {
        this.initializeRoutes();
    }

    private initializeRoutes() {
        this.router.post(
            `${this.path}/signup`,
        )

        this.router.post(
            `${this.path}/login`,
        );

        this.router.patch(
            `${this.path}/set-password`,
        );
    }
}