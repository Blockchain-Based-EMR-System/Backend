import { HttpException } from "@/exceptions/HttpException";
import { RequestWithUser, USER_ROLE } from "@/interfaces";
import { AiAppointmentsService } from "@/services/ai_appointments.service";
import { catchAsync } from "@/utils/catchAsync";
import { createBilingualError, ErrorMessages } from "@/utils/errorMessages";
import { createMultiLangMessage, SuccessResponseMessages } from "@/utils/responseMessages";
import e, { Request, Response, NextFunction } from "express";
import Container from "typedi";

export class AiAppointmentsController {
    public aiAppointmentsService = Container.get(AiAppointmentsService);

    public getUploadUrl = catchAsync(async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
        const appointmentId = req.params.appointmentId;
        const userType = req.query.userType as USER_ROLE.DOCTOR | USER_ROLE.PATIENT | "MIXED";

        if (userType !== USER_ROLE.DOCTOR && userType !== USER_ROLE.PATIENT && userType !== "MIXED") {
            const error = createBilingualError(400, ErrorMessages.INVALID_USER_TYPE);
            throw new HttpException(error.status, error.message, error.messageAr);
        }
        const objectKey = `appointments/${appointmentId}/${userType}.webm`;

        const isAppointmentExist = await this.aiAppointmentsService.checkAppointmentExistence(appointmentId);
        if (!isAppointmentExist) {
            const error = createBilingualError(404, ErrorMessages.APPOINTMENT_NOT_FOUND);
            throw new HttpException(error.status, error.message, error.messageAr);
        }
        const uploadUrl = await this.aiAppointmentsService.getUploadUrl(objectKey);
        const responseMessage = createMultiLangMessage(SuccessResponseMessages.UPLOAD_URL_GENERATED);
        res.status(200).json({
            ...responseMessage,
            data: {
                uploadUrl,
                objectKey
            }
        });
    })

    public processAudioAI = catchAsync(async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
        const appointmentId = req.params.appointmentId;
        const { doctorKey, patientKey, mixedKey } = req.body;

        const isAppointmentExist = await this.aiAppointmentsService.checkAppointmentExistence(appointmentId);
        if (!isAppointmentExist) {
            const error = createBilingualError(404, ErrorMessages.APPOINTMENT_NOT_FOUND);
            throw new HttpException(error.status, error.message, error.messageAr);
        }

        let finalScript: string;

        if (doctorKey && patientKey) {
            finalScript = await this.aiAppointmentsService.processSeparateAudioAI(doctorKey, patientKey);
        }

        else if (mixedKey) {
            finalScript = await this.aiAppointmentsService.processMixedAudioAI(mixedKey);
        }

        else {
            const error = createBilingualError(400, ErrorMessages.MISSING_AUDIO_KEYS);
            throw new HttpException(error.status, error.message, error.messageAr);
        }        
        const SOAP = this.aiAppointmentsService.generateSOAP(finalScript);

        const responseMessage = createMultiLangMessage(SuccessResponseMessages.SOAP_GENERATED);
        res.status(202).json({
            ...responseMessage,
            data: {
                SOAP
            }
        });
    })
}