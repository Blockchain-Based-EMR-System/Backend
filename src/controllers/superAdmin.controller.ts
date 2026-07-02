import { AddAdminFromSuperAdminDto } from "@/dtos/superAdmins.dto";
import { SuperAdminService } from "@/services/superAdmin.service";
import { createMultiLangMessage, SuccessResponseMessages } from "@/utils/responseMessages";
import { NextFunction, Response, Request } from "express";
import Container from "typedi";

export class SuperAdminController {

    public superAdminService = Container.get(SuperAdminService);

    public addAdmin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const adminData: AddAdminFromSuperAdminDto = req.body;
        const newAdmin = await this.superAdminService.addAdmin(adminData);
        const responseMessage = createMultiLangMessage(SuccessResponseMessages.ADMIN_ADDED_SUCCESSFULLY);
        res.status(201).json({
            data: newAdmin,
            messageEn: responseMessage.messageEn,
            messageAr: responseMessage.messageAr
        });
    }

    public getAllAdmins = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const admins = await this.superAdminService.getAllAdmins();
        const responseMessage = createMultiLangMessage(SuccessResponseMessages.ADMINS_RETRIEVED_SUCCESSFULLY);
        res.status(200).json({
            data: admins,
            messageEn: responseMessage.messageEn,
            messageAr: responseMessage.messageAr
        });
    }

    public getAdminById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const adminId: string = req.params.id;
        const admin = await this.superAdminService.getAdminById(adminId);
        const responseMessage = createMultiLangMessage(SuccessResponseMessages.ADMIN_RETRIEVED_SUCCESSFULLY);
        res.status(200).json({
            data: admin,
            messageEn: responseMessage.messageEn,
            messageAr: responseMessage.messageAr
        });
    }
}