import { RequestWithUser, USER_ROLE } from "@/interfaces";
import { AiAppointmentsService } from "@/services/ai_appointments.service";
import { catchAsync } from "@/utils/catchAsync";
import { createBilingualError, ErrorMessages } from "@/utils/errorMessages";
import { createMultiLangMessage, SuccessResponseMessages } from "@/utils/responseMessages";
import { Request, Response, NextFunction } from "express";
import Container from "typedi";

export class AiAppointmentsController {
    public aiAppointmentsService = Container.get(AiAppointmentsService);

    public getUploadUrl = catchAsync(async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
        const appointmentId = req.params.appointmentId;
        const userType = req.query.userType as USER_ROLE.DOCTOR | USER_ROLE.PATIENT;
        const objectKey = `appointments/${appointmentId}/${userType}.webm`;

        const isAppointmentExist = await this.aiAppointmentsService.checkAppointmentExistence(appointmentId);
        if (!isAppointmentExist) {
            const errorMessage = createBilingualError(404, ErrorMessages.APPOINTMENT_NOT_FOUND);
            return next(errorMessage);
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
}