import { CreateUpdateClinicRequestDto } from "@/dtos/clinics.dto";
import { HttpException } from "@/exceptions/HttpException";
import { RequestWithUser } from "@/interfaces";
import { ClinicService } from "@/services/clinic.service";
import { createBilingualError, ErrorMessages } from "@/utils/errorMessages";
import { NextFunction, Request, Response } from "express";
import Container from "typedi";

export class ClinicController {
    public clinicService = Container.get(ClinicService);

    public createClinic = async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
        const clinicData: CreateUpdateClinicRequestDto = req.body;

        const isAllowedToCreateClinic = await this.clinicService.isDoctorAllowedToCreateClinic(req.user.id);
        if (!isAllowedToCreateClinic) {
            const error = createBilingualError(403, ErrorMessages.MAX_CLINICS_REACHED);
            throw new HttpException(error.status, error.message, error.messageAr);
        }

        const createdClinic = await this.clinicService.createClinic(req.user.id, clinicData);

        this.clinicService.linkDoctorToClinic(req.user.id, createdClinic, clinicData.fees);

        res.status(201).json({ message: 'Clinic created successfully' });
    }

    public getClinicById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const clinicId = req.params.id;

        const clinic = await this.clinicService.getClinicById(clinicId);
        if (!clinic) {
            const error = createBilingualError(404, ErrorMessages.CLINIC_NOT_FOUND);
            throw new HttpException(error.status, error.message, error.messageAr);
        }

        res.status(200).json({ message: 'Clinic retrieved successfully', data: clinic });
    }

    public updateClinicById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const clinicId = req.params.id;
        const clinicUpdateData: CreateUpdateClinicRequestDto = req.body;

        const isClinicUpdated = await this.clinicService.updateClinic(clinicId, clinicUpdateData);

        if (!isClinicUpdated) {
            const error = createBilingualError(404, ErrorMessages.CLINIC_NOT_FOUND);
            throw new HttpException(error.status, error.message, error.messageAr);
        }

        res.status(200).json({ message: 'Clinic updated successfully' });
    }

    public deleteClinicById = async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
        const clinicId = req.params.id;

        const isCreatingDoctor = await this.clinicService.isCreatingDoctorOfClinic(req.user.id, clinicId);

        if (!isCreatingDoctor) {
            const error = createBilingualError(403, ErrorMessages.UNAUTHORIZED_CLINIC_DELETION);
            throw new HttpException(error.status, error.message, error.messageAr);
        }
        await this.clinicService.deleteClinic(clinicId);

        res.status(200).json({ message: 'Clinic deleted successfully' });
    }

    public getDoctorClinics = async (req: RequestWithUser, res: Response, next: NextFunction) => {
        const doctorId = req.user?.id;
        const clinics = await this.clinicService.getDoctorClinics(doctorId);
        res.status(200).json({ data: clinics, message: 'Doctor clinics retrieved successfully' });
    }

    public getActiveClinics = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const clinics = await this.clinicService.getActiveClinics();
        res.status(200).json({ data: clinics, message: 'Clinics retrieved successfully' });
    }
}
