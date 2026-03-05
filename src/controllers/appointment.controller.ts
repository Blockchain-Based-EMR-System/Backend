import { Request, Response, NextFunction } from "express";
import { RequestWithUser } from "@/interfaces";
import { HttpException } from "@/exceptions/HttpException";
import { catchAsync } from '@/utils/catchAsync';
import { AppointmentService } from "@/services/appointment.service"
import Container from "typedi";
import { createBilingualError, ErrorMessages } from '@/utils/errorMessages';
import { SuccessResponseMessages, createMultiLangMessage } from '@/utils/responseMessages';
import { SocketService } from "@/services/socket.service";
import { Agora_APP_ID } from "@/config";

export class AppointmentController {

    public appointmentService = Container.get(AppointmentService);
    public socketService = new SocketService();

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

    public getTodayAppointment = catchAsync(async (req: RequestWithUser, res: Response): Promise<void> => {
        const patientId = req.user.id;

        if (!patientId) {
            const error = createBilingualError(400, ErrorMessages.PATIENT_ID_REQUIRED);
            throw new HttpException(error.status, error.message, error.messageAr);
        }

        const appointments = await this.appointmentService.getTodayAppointment(patientId);
        const response = createMultiLangMessage(SuccessResponseMessages.PATIENT_TODAY_APPOINTMENT_RETRIEVED);
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

        // const { doctorId, scheduledTime } = await this.appointmentService.getAppointmentOwners(appointmentId);

        await this.appointmentService.rescheduleAppointmentByPatient(patientId, appointmentId, new Date(newScheduledTime));

        // await this.socketService.emitQueueUpdatesToPatients(doctorId, new Date(scheduledTime));
        // await this.socketService.emitQueueUpdatesToPatients(doctorId, new Date(newScheduledTime));

        // this.socketService.emitToUser(doctorId, 'appointment_rescheduled_by_patient', {
        //     appointmentId,
        //     patientId,
        //     oldScheduledTime: scheduledTime,
        //     newScheduledTime: new Date(newScheduledTime).toISOString(),
        // });
        // idk
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
        const { minutes } = req.body;

        if (!doctorId) {
            const error = createBilingualError(400, ErrorMessages.DOCTOR_ID_REQUIRED);
            throw new HttpException(error.status, error.message, error.messageAr);
        }

        if (minutes > 60) {
            const error = createBilingualError(400, ErrorMessages.MINUTES_EXCEEDED_LIMIT);
            throw new HttpException(error.status, error.message, error.messageAr);
        }

        await this.appointmentService.rescheduleAppointmentByDoctor(doctorId, appointmentId, minutes);
        const response = createMultiLangMessage(SuccessResponseMessages.APPOINTMENT_RESCHEDULED_SUCCESSFULLY);
        res.status(200).json({
            ...response
        });
    });

    public getUpcommingDoctorSchedule = catchAsync(async (req: RequestWithUser, res: Response): Promise<void> => {
        const doctorId = req.user.id;

        if (!doctorId) {
            const error = createBilingualError(400, ErrorMessages.DOCTOR_ID_REQUIRED);
            throw new HttpException(error.status, error.message, error.messageAr);
        }

        const schedule = await this.appointmentService.getUpcommingDoctorSchedule(doctorId);
        const response = createMultiLangMessage(SuccessResponseMessages.DOCTOR_SCHEDULE_RETRIEVED);
        res.status(200).json({
            data: schedule,
            ...response
        });
    });

    public getCurrentDoctorSchedule = catchAsync(async (req: RequestWithUser, res: Response): Promise<void> => {
        const doctorId = req.user.id;

        if (!doctorId) {
            const error = createBilingualError(400, ErrorMessages.DOCTOR_ID_REQUIRED);
            throw new HttpException(error.status, error.message, error.messageAr);
        }

        const schedule = await this.appointmentService.getCurrentDoctorSchedule(doctorId);
        const response = createMultiLangMessage(SuccessResponseMessages.DOCTOR_SCHEDULE_RETRIEVED);
        res.status(200).json({
            data: schedule,
            ...response
        });
    });

    public enterDoctorSchedule = catchAsync(async (req: RequestWithUser, res: Response): Promise<void> => {
        const doctorId = req.user.id;
        const {
            clinicId,
            workingDay,
            startTime,
            endTime,
            slotDuration,
            bufferTime,
            isOnline,
        } = req.body;

        if (!doctorId) {
            const error = createBilingualError(400, ErrorMessages.DOCTOR_ID_REQUIRED);
            throw new HttpException(error.status, error.message, error.messageAr);
        }

        await this.appointmentService.enterDoctorSchedule(doctorId, clinicId || null, workingDay, startTime, endTime, slotDuration, bufferTime, isOnline);

        const response = createMultiLangMessage(SuccessResponseMessages.SCHEDULE_CREATED_SUCCESSFULLY);
        res.status(201).json({
            ...response
        });
    });

    public getDoctorSchedule = catchAsync(async (req: RequestWithUser, res: Response): Promise<void> => {
        const doctorId = req.user.id;

        if (!doctorId) {
            const error = createBilingualError(400, ErrorMessages.DOCTOR_ID_REQUIRED);
            throw new HttpException(error.status, error.message, error.messageAr);
        }

        const schedules = await this.appointmentService.getDoctorSchedule(doctorId);
        const response = createMultiLangMessage(SuccessResponseMessages.DOCTOR_SCHEDULE_RETRIEVED);
        res.status(200).json({
            data: schedules,
            ...response
        });

    });

    public editDoctorSchedule = catchAsync(async (req: RequestWithUser, res: Response): Promise<void> => {
        const doctorId = req.user.id;

        if (!doctorId) {
            const error = createBilingualError(400, ErrorMessages.DOCTOR_ID_REQUIRED);
            throw new HttpException(error.status, error.message, error.messageAr);
        }

        const { scheduleId, workingDay, ...body } = req.body;

        // for resolving the mapping issue with the db 
        const updates = this.appointmentService.convertKeysToSnakeCase(body);

        if (workingDay !== undefined) {
            updates.day_of_week = this.appointmentService.getDayOfWeek(workingDay);
        }
        await this.appointmentService.editDoctorSchedule(doctorId, scheduleId, updates);
        const response = createMultiLangMessage(SuccessResponseMessages.SCHEDULE_UPDATED_SUCCESSFULLY);
        res.status(200).json({
            ...response
        });

    });

    public getScheduleByDate = catchAsync(async (req: RequestWithUser, res: Response): Promise<void> => {
        const doctorId = req.user.id;
        const { date } = req.query;

        if (!doctorId) {
            const error = createBilingualError(400, ErrorMessages.DOCTOR_ID_REQUIRED);
            throw new HttpException(error.status, error.message, error.messageAr);
        }

        if (!date) {
            const error = createBilingualError(400, ErrorMessages.DATE_REQUIRED);
            throw new HttpException(error.status, error.message, error.messageAr);
        }

        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(date as string)) {
            const error = createBilingualError(400, ErrorMessages.INVALID_DATE_FORMAT);
            throw new HttpException(error.status, error.message, error.messageAr);
        }

        const scheduleData = await this.appointmentService.getScheduleByDate(doctorId, date as string);
        const response = createMultiLangMessage(SuccessResponseMessages.DOCTOR_SCHEDULE_RETRIEVED);
        res.status(200).json({
            data: scheduleData,
            ...response
        });
    });

    public checkConflictingAppointments = catchAsync(async (req: RequestWithUser, res: Response): Promise<void> => {
        const doctorId = req.user.id;
        const { scheduleId, startDate, endDate } = req.query;

        if (!doctorId) {
            const error = createBilingualError(400, ErrorMessages.DOCTOR_ID_REQUIRED);
            throw new HttpException(error.status, error.message, error.messageAr);
        }

        if (!scheduleId) {
            const error = createBilingualError(400, ErrorMessages.SCHEDULE_ID_REQUIRED);
            throw new HttpException(error.status, error.message, error.messageAr);
        }

        if (startDate || endDate) {
            if (!startDate || !endDate) {
                const error = createBilingualError(400, ErrorMessages.VACATION_DATES_REQUIRED);
                throw new HttpException(error.status, error.message, error.messageAr);
            }

            const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
            if (!dateRegex.test(startDate as string) || !dateRegex.test(endDate as string)) {
                const error = createBilingualError(400, ErrorMessages.INVALID_DATE_FORMAT);
                throw new HttpException(error.status, error.message, error.messageAr);
            }

            const start = new Date(startDate as string);
            const end = new Date(endDate as string);

            if (start >= end) {
                const error = createBilingualError(400, ErrorMessages.INVALID_DATE_RANGE);
                throw new HttpException(error.status, error.message, error.messageAr);
            }
        }

        const checkResult = await this.appointmentService.checkConflictingAppointments(doctorId, scheduleId as string, startDate as string | undefined, endDate as string | undefined);

        const response = createMultiLangMessage(SuccessResponseMessages.APPOINTMENTS_CHECK_COMPLETED);
        res.status(200).json({
            ...response,
            data: checkResult
        });
    })

    public handleDoctorVacation = catchAsync(async (req: RequestWithUser, res: Response): Promise<void> => {
        const doctorId = req.user.id;
        const { scheduleId, startDate, endDate } = req.body;

        if (!doctorId) {
            const error = createBilingualError(400, ErrorMessages.DOCTOR_ID_REQUIRED);
            throw new HttpException(error.status, error.message, error.messageAr);
        }

        if (!scheduleId) {
            const error = createBilingualError(400, ErrorMessages.SCHEDULE_ID_REQUIRED);
            throw new HttpException(error.status, error.message, error.messageAr);
        }

        if (!startDate || !endDate) {
            const error = createBilingualError(400, ErrorMessages.VACATION_DATES_REQUIRED);
            throw new HttpException(error.status, error.message, error.messageAr);
        }


        await this.appointmentService.handleDoctorVacation(doctorId, scheduleId, startDate, endDate);
        const response = createMultiLangMessage(SuccessResponseMessages.VACATION_SET_SUCCESSFULLY);
        res.status(200).json({
            ...response
        });
    })

    public deleteDoctorSchedule = catchAsync(async (req: RequestWithUser, res: Response): Promise<void> => {
        const doctorId = req.user.id;
        const { scheduleId } = req.body;

        if (!doctorId) {
            const error = createBilingualError(400, ErrorMessages.DOCTOR_ID_REQUIRED);
            throw new HttpException(error.status, error.message, error.messageAr);
        }

        if (!scheduleId) {
            const error = createBilingualError(400, ErrorMessages.SCHEDULE_ID_REQUIRED);
            throw new HttpException(error.status, error.message, error.messageAr);
        }

        await this.appointmentService.deleteDoctorSchedule(doctorId, scheduleId);
        const response = createMultiLangMessage(SuccessResponseMessages.SCHEDULE_DELETED_SUCCESSFULLY);
        res.status(200).json({
            ...response
        });
    })

    public getDoctorVacations = catchAsync(async (req: RequestWithUser, res: Response): Promise<void> => {
        const doctorId = req.user.id;

        if (!doctorId) {
            const error = createBilingualError(400, ErrorMessages.DOCTOR_ID_REQUIRED);
            throw new HttpException(error.status, error.message, error.messageAr);
        }

        const doctorVacations = await this.appointmentService.getDoctorVacations(doctorId)

        const response = createMultiLangMessage(SuccessResponseMessages.DOCTOR_VACATIONS_RETRIEVED);
        res.status(200).json({
            ...response,
            data: doctorVacations
        });
    })

    public cancelDoctorVacation = catchAsync(async (req: RequestWithUser, res: Response): Promise<void> => {
        const doctorId = req.user.id;
        const { vacationId, scheduleId } = req.body;

        if (!doctorId) {
            const error = createBilingualError(400, ErrorMessages.DOCTOR_ID_REQUIRED);
            throw new HttpException(error.status, error.message, error.messageAr);
        }

        if (!scheduleId) {
            const error = createBilingualError(400, ErrorMessages.SCHEDULE_ID_REQUIRED);
            throw new HttpException(error.status, error.message, error.messageAr);
        }

        await this.appointmentService.cancelDoctorVacation(doctorId, vacationId, scheduleId);
        const response = createMultiLangMessage(SuccessResponseMessages.VACATION_REMOVED_SUCCESSFULLY);
        res.status(200).json({
            ...response
        });
    });

    public getAppointmentsByDate = catchAsync(async (req: RequestWithUser, res: Response): Promise<void> => {
        const nurseId = req.user?.id;
        const { doctorId, clinicId, date } = req.query;

        if (!nurseId) {
            const error = createBilingualError(400, ErrorMessages.NURSE_ID_NOT_FOUND);
            throw new HttpException(error.status, error.message, error.messageAr);
        }

        if (!doctorId) {
            const error = createBilingualError(400, ErrorMessages.DOCTOR_ID_REQUIRED);
            throw new HttpException(error.status, error.message, error.messageAr);
        }

        if (!date) {
            const error = createBilingualError(400, ErrorMessages.DATE_REQUIRED);
            throw new HttpException(error.status, error.message, error.messageAr);
        }

        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(date as string)) {
            const error = createBilingualError(400, ErrorMessages.INVALID_DATE_FORMAT);
            throw new HttpException(error.status, error.message, error.messageAr);
        }

        const appointments = await this.appointmentService.getAppointmentsByDate(doctorId as string, clinicId as string, date as string);
        const response = createMultiLangMessage(SuccessResponseMessages.APPOINTMENTS_BY_NURSE_RETRIEVED);
        res.status(200).json({
            data: appointments,
            ...response
        });
    });

    public completeAppointment = catchAsync(async (req: RequestWithUser, res: Response): Promise<void> => {
        const nurseId = req.user?.id;
        const { appointmentId } = req.params;

        if (!nurseId) {
            const error = createBilingualError(400, ErrorMessages.NURSE_ID_NOT_FOUND);
            throw new HttpException(error.status, error.message, error.messageAr);
        }

        await this.appointmentService.completeAppointment(appointmentId);
        const response = createMultiLangMessage(SuccessResponseMessages.APPOINTMENT_COMPLETED_SUCCESSFULLY);
        res.status(200).json({
            ...response
        });
    });

    public getAgoraToken = catchAsync(async (req: RequestWithUser, res: Response): Promise<void> => {
        const userId = req.user?.id;
        const { appointmentId } = req.params;

        const token = await this.appointmentService.generateAgoraToken(appointmentId, userId);
        const response = createMultiLangMessage(SuccessResponseMessages.AGORA_TOKEN_GENERATED_SUCCESSFULLY);
        res.status(200).json({
            ...response,
            data: {
                token,
                appId: Agora_APP_ID
            }
        });
    });
}