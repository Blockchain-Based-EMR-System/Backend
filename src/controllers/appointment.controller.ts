import { Request, Response, NextFunction } from "express";
import { RequestWithUser } from "@/interfaces";
import { HttpException } from "@/exceptions/HttpException";
import { catchAsync } from '@/utils/catchAsync';
import { AppointmentService } from "@/services/appointment.service"
import Container from "typedi";
import { createBilingualError, ErrorMessages } from '@/utils/errorMessages';


export class AppointmentController {

    public appointmentService = Container.get(AppointmentService);

    public getAvailableDays = catchAsync(async (req: Request, res: Response): Promise<void> => {
        const { doctorId } = req.params;
        const { clinicId } = req.query;

        if (!doctorId) {
            const error = createBilingualError(400, ErrorMessages.DOCTOR_ID_REQUIRED);
            throw new HttpException(error.status, error.message, error.messageAr);
        }

        const availableDays = await this.appointmentService.getAvailableDays(doctorId, clinicId as string || null)
        res.status(200).json({
            data: availableDays,
        });

    });

    public getAvailableSlots = catchAsync(async (req: Request, res: Response): Promise<void> => {
        const { doctorId } = req.params;
        const { date, clinicId } = req.query;

        if (!doctorId) {
            const error = createBilingualError(400, ErrorMessages.DOCTOR_ID_REQUIRED);
            throw new HttpException(error.status, error.message, error.messageAr);
        }

        if (!date) {
            const error = createBilingualError(400, ErrorMessages.DATE_REQUIRED);
            throw new HttpException(error.status, error.message, error.messageAr);
        }

        // validate date format (YYYY-MM-DD)
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(date as string)) {
            const error = createBilingualError(400, ErrorMessages.INVALID_DATE_FORMAT);
            throw new HttpException(error.status, error.message, error.messageAr);
        }

        const requestedDate = new Date(date as string);
        if (isNaN(requestedDate.getTime())) {
            const error = createBilingualError(400, ErrorMessages.INVALID_DATE_FORMAT);
            throw new HttpException(error.status, error.message, error.messageAr);
        }

        const availableSlots = await this.appointmentService.getAvailableSlots(doctorId, clinicId as string || null, date as string)
        res.status(200).json({
            data: availableSlots,
        });

    });

    // book a new appointment 
    public bookAppointment = catchAsync(async (req: RequestWithUser, res: Response): Promise<void> => {
        const patientId = req.user.id;
        const { doctorId, clinicId, scheduledTime } = req.body;
        const scheduledDate = new Date(scheduledTime);

        if (!doctorId) {
            const error = createBilingualError(400, ErrorMessages.DOCTOR_ID_REQUIRED);
            throw new HttpException(error.status, error.message, error.messageAr);
        }

        if (!scheduledTime) {
            const error = createBilingualError(400, ErrorMessages.SCHEDULED_TIME_REQUIRED);
            throw new HttpException(error.status, error.message, error.messageAr);
        }
        
        if (isNaN(scheduledDate.getTime())) {
            const error = createBilingualError(400, ErrorMessages.INVALID_SCHEDULED_TIME);
            throw new HttpException(error.status, error.message, error.messageAr);
        }

        await this.appointmentService.bookAppointment(patientId, doctorId, clinicId || null, scheduledDate);

        res.status(201).json({
            message: 'Appointment booked successfully',
        });
    });
}