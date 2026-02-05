
import { NextFunction, Request, Response } from 'express';
import { Container } from 'typedi';
import { AdminService } from '@/services/admin.service';
import { AddDoctorFromAdminDto } from '@/dtos/admins.dto';
import { RequestWithLanguage } from '@/middlewares/language.middleware';
import { formatSpecializationResponse } from '@/utils/specializationTransform';
import { SpecializationKey } from '@/constants/specializations';
import { createMultiLangMessage, SuccessResponseMessages } from '@/utils/responseMessages';
import { HttpException } from '@/exceptions/HttpException';
import { createBilingualError, ErrorMessages } from '@/utils/errorMessages';
import { ClinicService } from '@/services/clinic.service';
import { ClinicResponseDto } from '@/dtos/clinics.dto';

export class AdminController {
    public adminService = Container.get(AdminService);
    public clinicService = Container.get(ClinicService);

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
        const responseMessage = createMultiLangMessage(SuccessResponseMessages.DOCTOR_CREATED);
        res.status(201).json({
            data: doctorResponse,
            messageEn: responseMessage.messageEn,
            messageAr: responseMessage.messageAr,
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
        const responseMessage = createMultiLangMessage(SuccessResponseMessages.DOCTORS_RETRIEVED);
        res.status(200).json({
            data: formattedDoctors,
            messageEn: responseMessage.messageEn,
            messageAr: responseMessage.messageAr,
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
        const responseMessage = createMultiLangMessage(SuccessResponseMessages.DOCTOR_RETRIEVED);

        res.status(200).json({
            data: formattedDoctor,
            messageEn: responseMessage.messageEn,
            messageAr: responseMessage.messageAr,
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
        const responseMessage = createMultiLangMessage(SuccessResponseMessages.UNVERIFIED_DOCTORS_RETRIEVED);
        res.status(200).json({
            data: formattedDoctors,
            messageEn: responseMessage.messageEn,
            messageAr: responseMessage.messageAr,
        });
    }

    public updateDoctorVerificationStatus = async (req: RequestWithLanguage, res: Response, next: NextFunction): Promise<void> => {

        const doctorId = req.params.id;
        const { isVerified } = req.body;
        await this.adminService.updateDoctorVerificationStatus(doctorId, isVerified);
        await this.adminService.sendVerificationStatusEmail(doctorId, isVerified);
        const responseMessage = createMultiLangMessage(SuccessResponseMessages.DOCTOR_VERIFICATION_STATUS_UPDATED);
        res.status(200).json({
            messageEn: responseMessage.messageEn,
            messageAr: responseMessage.messageAr,
        });
    }

    // Clinic Routes
    public getAllClinics = async (req: Request, res: Response, next: NextFunction): Promise<void> => {

        const clinics = await this.clinicService.getAllClinics();
        const responseMessage = createMultiLangMessage(SuccessResponseMessages.CLINIC_RETRIEVED);
        res.status(200).json({
            data: clinics,
            messageEn: responseMessage.messageEn,
            messageAr: responseMessage.messageAr,
        });
    }
    public getClinicById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const clinicId = req.params.id;
        const clinic = await this.clinicService.getClinicById(clinicId);
        if (!clinic) {
            const error = createBilingualError(404, ErrorMessages.CLINIC_NOT_FOUND);
            throw new HttpException(error.status, error.message, error.messageAr);
        }
        const responseMessage = createMultiLangMessage(SuccessResponseMessages.CLINIC_RETRIEVED);
        res.status(200).json({ messageEn: responseMessage.messageEn, messageAr: responseMessage.messageAr, data: clinic });
    }

}