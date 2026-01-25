import { AddAdminFromSuperAdminDto } from "@/dtos/superAdmins.dto";
import { SuperAdminService } from "@/services/superAdmin.service";
import { NextFunction, Response, Request } from "express";
import Container from "typedi";

export class SuperAdminController {

    public superAdminService = Container.get(SuperAdminService);

    public addAdmin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const adminData: AddAdminFromSuperAdminDto = req.body;
        const newAdmin = await this.superAdminService.addAdmin(adminData);
        res.status(201).json({
            data: newAdmin,
            message: 'Admin added successfully'
        });
    }

    public getAllAdmins = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const admins = await this.superAdminService.getAllAdmins();
        res.status(200).json({
            data: admins,
            message: 'Admins retrieved successfully'
        });
    }

    public getAdminById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const adminId: string = req.params.id;
        const admin = await this.superAdminService.getAdminById(adminId);
        res.status(200).json({
            data: admin,
            message: 'Admin retrieved successfully'
        });
    }
}