import { Request, Response, NextFunction } from "express";
import { RequestWithUser } from "@/interfaces";
import { HttpException } from "@/exceptions/HttpException";
import { catchAsync } from '@/utils/catchAsync';
import { AppointmentService } from "@/services/appointment.service"
import Container from "typedi";
import { createBilingualError, ErrorMessages } from '@/utils/errorMessages';
import { SuccessResponseMessages, createMultiLangMessage } from '@/utils/responseMessages';


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
        const response = createMultiLangMessage(SuccessResponseMessages.AVAILABLE_DAYS_RETRIEVED);
        res.status(200).json({
            data: availableDays,
            ...response
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
        const response = createMultiLangMessage(SuccessResponseMessages.AVAILABLE_SLOTS_RETRIEVED);
        res.status(200).json({
            data: availableSlots,
            ...response
        });

    });

    // book a new appointment 
    public bookAppointment = catchAsync(async (req: RequestWithUser, res: Response): Promise<void> => {
        const patientId = req.user.id;
        const { doctorId, clinicId, scheduledTime } = req.body;
        const scheduledDate = new Date(scheduledTime);

        if (isNaN(scheduledDate.getTime())) {
            const error = createBilingualError(400, ErrorMessages.INVALID_SCHEDULED_TIME);
            throw new HttpException(error.status, error.message, error.messageAr);
        }

        await this.appointmentService.bookAppointment(patientId, doctorId, clinicId || null, scheduledDate);
        const response = createMultiLangMessage(SuccessResponseMessages.APPOINTMENT_BOOKED_SUCCESSFULLY);

        res.status(201).json({
            ...response
        });
    });

    public getPatientAppointments = catchAsync(async (req: RequestWithUser, res: Response): Promise<void> => {
        const patientId = req.user.id;

        if (!patientId) {
            const error = createBilingualError(400, ErrorMessages.PATIENT_ID_REQUIRED);
            throw new HttpException(error.status, error.message, error.messageAr);
        }

        const appointments = await this.appointmentService.getPatientAppointments(patientId);
        const response = createMultiLangMessage(SuccessResponseMessages.PATIENT_APPOINTMENTS_RETRIEVED);
        res.status(200).json({
            data: appointments,
            ...response
        });
    });

    public getPatientSelectedAppointment = catchAsync(async (req: RequestWithUser, res: Response): Promise<void> => {
        const patientId = req.user.id;
        const { appointmentId } = req.params;

        if (!patientId) {
            const error = createBilingualError(400, ErrorMessages.PATIENT_ID_REQUIRED);
            throw new HttpException(error.status, error.message, error.messageAr);
        }

        const appointment = await this.appointmentService.getPatientSelectedAppointment(appointmentId, patientId);
        const response = createMultiLangMessage(SuccessResponseMessages.APPOINTMENT_DETAILS_RETRIEVED);
        res.status(200).json({
            data: appointment,
            ...response
        });
    });

    public rescheduleAppointmentByPatient = catchAsync(async (req: RequestWithUser, res: Response): Promise<void> => {
        const patientId = req.user.id;
        const { appointmentId } = req.params;
        const { newScheduledTime } = req.body;
        
        await this.appointmentService.rescheduleAppointmentByPatient(patientId, appointmentId, new Date(newScheduledTime));
        const response = createMultiLangMessage(SuccessResponseMessages.APPOINTMENT_RESCHEDULED_SUCCESSFULLY);
        res.status(200).json({
            ...response
        });
    });

    public cancelAppointment = catchAsync(async (req: RequestWithUser, res: Response): Promise<void> => {
        const userId = req.user.id;
        const { appointmentId } = req.params;

        await this.appointmentService.cancelAppointment(userId, appointmentId);
        const response = createMultiLangMessage(SuccessResponseMessages.APPOINTMENT_CANCELLED_SUCCESSFULLY);
        res.status(200).json({
            ...response
        });
    });

    public rescheduleAppointmentByDoctor = catchAsync(async (req: RequestWithUser, res: Response): Promise<void> => {
        const doctorId = req.user.id;
        const { appointmentId } = req.params;
        const { minutes, newScheduledTime } = req.body;

        if (!doctorId) {
            const error = createBilingualError(400, ErrorMessages.DOCTOR_ID_REQUIRED);
            throw new HttpException(error.status, error.message, error.messageAr);
        }

        if (minutes && newScheduledTime) {
            const error = createBilingualError(400, ErrorMessages.EITHER_MINUTES_OR_NEW_TIME);
            throw new HttpException(error.status, error.message, error.messageAr);
        }

        await this.appointmentService.rescheduleAppointmentByDoctor(doctorId, appointmentId, minutes, newScheduledTime ? new Date(newScheduledTime) : undefined);
        const response = createMultiLangMessage(SuccessResponseMessages.APPOINTMENT_RESCHEDULED_SUCCESSFULLY);
        res.status(200).json({
            ...response
        });
    });

    public bulkRescheduleByDoctor = catchAsync(async (req: RequestWithUser, res: Response): Promise<void> => {
        const doctorId = req.user.id;
        const { appointmentIds, minutes, newScheduledTime, keepOriginalSlots } = req.body;

        if (!doctorId) {
            const error = createBilingualError(400, ErrorMessages.DOCTOR_ID_REQUIRED);
            throw new HttpException(error.status, error.message, error.messageAr);
        }

        if (minutes && newScheduledTime) {
            const error = createBilingualError(400, ErrorMessages.EITHER_MINUTES_OR_NEW_TIME);
            throw new HttpException(error.status, error.message, error.messageAr);
        }

        await this.appointmentService.bulkRescheduleByDoctor(doctorId, appointmentIds, minutes, newScheduledTime ? new Date(newScheduledTime) : undefined, keepOriginalSlots);
        const response = createMultiLangMessage(SuccessResponseMessages.APPOINTMENTS_RESCHEDULED_SUCCESSFULLY);
        res.status(200).json({
            ...response
        });
    });

    public rescheduleDayAppointments = catchAsync(async (req: RequestWithUser, res: Response): Promise<void> => {
        const doctorId = req.user.id;
        const { currentDate, newDate, keepOriginalSlots } = req.body;

        if (!doctorId) {
            const error = createBilingualError(400, ErrorMessages.DOCTOR_ID_REQUIRED);
            throw new HttpException(error.status, error.message, error.messageAr);
        }

        await this.appointmentService.rescheduleDayAppointments(doctorId, new Date(currentDate), new Date(newDate), keepOriginalSlots);
        const response = createMultiLangMessage(SuccessResponseMessages.APPOINTMENTS_RESCHEDULED_SUCCESSFULLY);
        res.status(200).json({
            ...response
        });
    });

    public getDoctorSchedule = catchAsync(async (req: RequestWithUser, res: Response): Promise<void> => {
        const doctorId = req.user.id;

        if (!doctorId) {
            const error = createBilingualError(400, ErrorMessages.DOCTOR_ID_REQUIRED);
            throw new HttpException(error.status, error.message, error.messageAr);
        }

        const schedule = await this.appointmentService.getDoctorSchedule(doctorId);
        const response = createMultiLangMessage(SuccessResponseMessages.DOCTOR_SCHEDULE_RETRIEVED);
        res.status(200).json({
            data: schedule,
            ...response
        });
    });
}