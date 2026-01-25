
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
        const doctorData: AddDoctorFromAdminDto = req.body;
        const newDoctor = await this.adminService.addDoctor(doctorData);

        const formattedNewDoctor = newDoctor.doctor ? {
            ...newDoctor.doctor,
            specialization: formatSpecializationResponse(
                newDoctor.doctor.specialization as SpecializationKey,
                req.language
            ),
        } : null;

        const doctorResponse = {
            ...newDoctor,
            doctor: formattedNewDoctor,
        };
        res.status(201).json({
            data: doctorResponse,
            message: 'Doctor added successfully'
        });
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

    public getUnverifiedDoctors = async (req: RequestWithLanguage, res: Response, next: NextFunction): Promise<void> => {

        const unverifiedDoctors = await this.adminService.getUnverifiedDoctors();
        const language = req.language;
        // Format specializations based on language preference
        const formattedDoctors = unverifiedDoctors.map(doctor => ({
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
            message: 'Unverified doctors retrieved successfully'
        });
    }

    public updateDoctorVerificationStatus = async (req: RequestWithLanguage, res: Response, next: NextFunction): Promise<void> => {

        const doctorId = req.params.id;
        const { isVerified } = req.body;
        await this.adminService.updateDoctorVerificationStatus(doctorId, isVerified);      
        res.status(200).json({
            message: 'Doctor verification status updated successfully'
        });
    }
}