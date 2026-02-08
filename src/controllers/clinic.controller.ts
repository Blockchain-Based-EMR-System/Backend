import { CreateUpdateClinicRequestDto } from "@/dtos/clinics.dto";
import { HttpException } from "@/exceptions/HttpException";
import { RequestWithUser } from "@/interfaces";
import { ClinicService } from "@/services/clinic.service";
import { catchAsync } from "@/utils/catchAsync";
import { createBilingualError, ErrorMessages } from "@/utils/errorMessages";
import { createMultiLangMessage, SuccessResponseMessages } from "@/utils/responseMessages";
import { NextFunction, Request, Response } from "express";
import Container from "typedi";

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
        if(!isCreatingDoctor) {
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
        const {clinicId} = req.params;
        const doctors = await this.clinicService.getClinicDoctors(clinicId);
        const response = createMultiLangMessage(SuccessResponseMessages.CLINIC_DOCTORS_RETRIEVED);
        res.status(200).json({
            data: doctors,
            ...response
        });

    }

    public getActiveClinics = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const clinics = await this.clinicService.getActiveClinics();
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
        const isFeesUpdated = await this.clinicService.updateClinicFees(req.user.id , clinicId, fees);

        if (!isFeesUpdated) {
            const error = createBilingualError(404, ErrorMessages.CLINIC_NOT_FOUND);
            throw new HttpException(error.status, error.message, error.messageAr);
        }
        const responseMessage = createMultiLangMessage(SuccessResponseMessages.CLINIC_FEES_UPDATED_SUCCESSFULLY);
        res.status(200).json({ messageEn: responseMessage.messageEn, messageAr: responseMessage.messageAr });
    });
}
