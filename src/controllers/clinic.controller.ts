import { CreateUpdateClinicRequestDto } from "@/dtos/clinics.dto";
import { HttpException } from "@/exceptions/HttpException";
import { RequestWithUser } from "@/interfaces";
import { ClinicService } from "@/services/clinic.service";
import { catchAsync } from "@/utils/catchAsync";
import { createBilingualError, ErrorMessages } from "@/utils/errorMessages";
import { createMultiLangMessage, SuccessResponseMessages } from "@/utils/responseMessages";
import { NextFunction, Request, Response } from "express";
import Container from "typedi";
import { Gender } from "@prisma/client";

export class ClinicController {
    public clinicService = Container.get(ClinicService);

    public createClinic = catchAsync(async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
        const clinicData: CreateUpdateClinicRequestDto = req.body;

        const isAllowedToCreateClinic = await this.clinicService.isDoctorAllowedToCreateClinic(req.user.id);
        if (!isAllowedToCreateClinic) {
            const error = createBilingualError(403, ErrorMessages.MAX_CLINICS_REACHED);
            throw new HttpException(error.status, error.message, error.messageAr);
        }

        const createdClinic = await this.clinicService.createClinic(req.user.id, clinicData);

        this.clinicService.linkDoctorToClinic(req.user.id, createdClinic, clinicData.fees);

        const responseMessage = createMultiLangMessage(SuccessResponseMessages.CLINIC_CREATED_SUCCESSFULLY);

        res.status(201).json({ messageEn: responseMessage.messageEn, messageAr: responseMessage.messageAr });
    });

    public getClinicById = catchAsync(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const clinicId = req.params.id;

        const clinic = await this.clinicService.getClinicById(clinicId);
        if (!clinic) {
            const error = createBilingualError(404, ErrorMessages.CLINIC_NOT_FOUND);
            throw new HttpException(error.status, error.message, error.messageAr);
        }
        const responseMessage = createMultiLangMessage(SuccessResponseMessages.CLINIC_RETRIEVED);
        res.status(200).json({ messageEn: responseMessage.messageEn, messageAr: responseMessage.messageAr, data: clinic });
    });

    public updateClinicById = catchAsync(async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
        const clinicId = req.params.id;
        const clinicUpdateData: CreateUpdateClinicRequestDto = req.body;
        const isCreatingDoctor = await this.clinicService.isCreatingDoctorOfClinic(req.user.id, clinicId);
        if (!isCreatingDoctor) {
            const error = createBilingualError(403, ErrorMessages.UNAUTHORIZED_CLINIC_UPDATE);
            throw new HttpException(error.status, error.message, error.messageAr);
        }
        const isClinicUpdated = await this.clinicService.updateClinic(req.user.id, clinicId, clinicUpdateData);

        if (!isClinicUpdated) {
            const error = createBilingualError(404, ErrorMessages.CLINIC_NOT_FOUND);
            throw new HttpException(error.status, error.message, error.messageAr);
        }
        const responseMessage = createMultiLangMessage(SuccessResponseMessages.CLINIC_UPDATED_SUCCESSFULLY);
        res.status(200).json({ messageEn: responseMessage.messageEn, messageAr: responseMessage.messageAr });
    });

    public deleteClinicById = catchAsync(async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
        const clinicId = req.params.id;

        const isCreatingDoctor = await this.clinicService.isCreatingDoctorOfClinic(req.user.id, clinicId);

        if (!isCreatingDoctor) {
            const error = createBilingualError(403, ErrorMessages.UNAUTHORIZED_CLINIC_DELETION);
            throw new HttpException(error.status, error.message, error.messageAr);
        }
        await this.clinicService.deleteClinic(clinicId);
        const responseMessage = createMultiLangMessage(SuccessResponseMessages.CLINIC_DELETED_SUCCESSFULLY);
        res.status(200).json({ messageEn: responseMessage.messageEn, messageAr: responseMessage.messageAr });
    });

    public getDoctorClinics = catchAsync(async (req: RequestWithUser, res: Response, next: NextFunction) => {
        const doctorId = req.user?.id;
        const clinics = await this.clinicService.getDoctorClinics(doctorId);
        const responseMessage = createMultiLangMessage(SuccessResponseMessages.CLINIC_DOCTORS_RETRIEVED);
        res.status(200).json({
            data: clinics,
            messageEn: responseMessage.messageEn,
            messageAr: responseMessage.messageAr
        });
    });

    public getClinicDoctors = async (req: Request, res: Response, next: NextFunction) => {
        const { clinicId } = req.params;
        const { gender, minFees, maxFees } = req.query;

        let validGender: Gender | undefined = undefined;
        if (gender && typeof gender === 'string') {
            const upperGender = gender.toUpperCase();
            if (Object.values(Gender).includes(upperGender as Gender)) {
                validGender = upperGender as Gender;
            }
        }

        const finalMinFees = minFees && typeof minFees === 'string' ? parseFloat(minFees) : undefined;
        const finalMaxFees = maxFees && typeof maxFees === 'string' ? parseFloat(maxFees) : undefined;

        if (finalMinFees > finalMaxFees){
            const error = createBilingualError(404, ErrorMessages.INVALID_FEES_RANGE);
            throw new HttpException(error.status, error.message, error.messageAr);
        }

        const doctors = await this.clinicService.getClinicDoctors(clinicId, validGender, finalMinFees, finalMaxFees);
        const response = createMultiLangMessage(SuccessResponseMessages.CLINIC_DOCTORS_RETRIEVED);
        res.status(200).json({
            data: doctors,
            ...response
        });
    }

    public getActiveClinics = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const { canPayOnline, lang } = req.query;
        if (!lang || (lang !== 'en' && lang !== 'ar')) {
            const error = createBilingualError(400, ErrorMessages.SPECIALIZATION_LANG);
            throw new HttpException(400, error.message, error.messageAr);
        }

        const payOnline = canPayOnline !== undefined ? canPayOnline === 'true' : undefined;
        const clinics = await this.clinicService.getActiveClinics(lang as 'en' | 'ar', payOnline);
        const response = createMultiLangMessage(SuccessResponseMessages.CLINICS_RETRIEVED_SUCCESSFULLY);
        res.status(200).json({
            data: clinics,
            ...response
        });
    }

    public updateClinicFeesById = catchAsync(async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
        const clinicId = req.params.id;
        const { fees } = req.body;
        const isDoctorLinkedToClinic = await this.clinicService.isDoctorLinkedToClinic(req.user.id, clinicId);
        if (!isDoctorLinkedToClinic) {
            const error = createBilingualError(403, ErrorMessages.UNAUTHORIZED_CLINIC_UPDATE);
            throw new HttpException(error.status, error.message, error.messageAr);
        }
        const isFeesUpdated = await this.clinicService.updateClinicFees(req.user.id, clinicId, fees);

        if (!isFeesUpdated) {
            const error = createBilingualError(404, ErrorMessages.CLINIC_NOT_FOUND);
            throw new HttpException(error.status, error.message, error.messageAr);
        }
        const responseMessage = createMultiLangMessage(SuccessResponseMessages.CLINIC_FEES_UPDATED_SUCCESSFULLY);
        res.status(200).json({ messageEn: responseMessage.messageEn, messageAr: responseMessage.messageAr });
    });
}
