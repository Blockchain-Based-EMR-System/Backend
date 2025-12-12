
import { NextFunction, Request, Response } from 'express';
import { Container } from 'typedi';
import { AdminService } from '@/services/admin.service';
import { AddDoctorFromAdminDto } from '@/dtos/admins.dto';
import { RequestWithLanguage } from '@/middlewares/language.middleware';
import { formatSpecializationResponse } from '@/utils/specializationTransform';
import { SpecializationKey } from '@/constants/specializations';

export class AdminController {
    public adminService = Container.get(AdminService);

    public addDoctor = async (req: RequestWithLanguage, res: Response, next: NextFunction): Promise<void> => {
        try {
            const doctorData: AddDoctorFromAdminDto = req.body;
            const newDoctor = await this.adminService.addDoctor(doctorData);

            res.status(201).json({
                data: newDoctor,
                message: 'Doctor added successfully'
            });
        } catch (error) {
            next(error);
        }
    };

    public getAllDoctors = async (req: RequestWithLanguage, res: Response, next: NextFunction): Promise<void> => {

        const doctors = await this.adminService.getAllDoctors();
        const language = req.language;

        // Format specializations based on language preference
        const formattedDoctors = doctors.map(doctor => ({
            ...doctor,
            doctor: doctor.doctor ? {
                ...doctor.doctor,
                specialization: formatSpecializationResponse(
                    doctor.doctor.specialization as SpecializationKey,
                    language
                ),
            } : null,
        }));

        res.status(200).json({
            data: formattedDoctors,
            message: 'Doctors retrieved successfully'
        });
    }


    public getDoctorById = async (req: RequestWithLanguage, res: Response, next: NextFunction): Promise<void> => {

        const doctorId = req.params.id;
        const doctor = await this.adminService.getDoctorById(doctorId);
        const language = req.language;

        // Format specialization based on language preference
        const formattedDoctor = {
            ...doctor,
            doctor: doctor.doctor ? {
                ...doctor.doctor,
                specialization: formatSpecializationResponse(
                    doctor.doctor.specialization as SpecializationKey,
                    language
                ),
            } : null,
        };

        res.status(200).json({
            data: formattedDoctor,
            message: 'Doctor retrieved successfully'
        });
    }

}