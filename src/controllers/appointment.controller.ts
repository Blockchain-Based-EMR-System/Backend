import { Request, Response, NextFunction } from "express";
import { RequestWithUser } from "@/interfaces";
import { HttpException } from "@/exceptions/HttpException";
import { catchAsync } from '@/utils/catchAsync';
import { AppointmentService } from "@/services/appointment.service"
import Container from "typedi";

export class AppointmentController {

    public appointmentService = Container.get(AppointmentService);

    public getAvailableDays = catchAsync(async (req: Request, res: Response): Promise<void> => {
        const { doctorId } = req.params;
        const { clinicId } = req.query;

        const availableDays = await this.appointmentService.getAvailableDays(doctorId, clinicId as string || null)
        res.status(200).json({
            data: availableDays,
            // message: 'Available days retrieved successfully',
        });

    });

    public getAvailableSlots = catchAsync(async (req: Request, res: Response): Promise<void> => {
        const { doctorId } = req.params;
        const { date, clinicId } = req.query;

        const availableSlots = await this.appointmentService.getAvailableSlots(doctorId, clinicId as string || null, date as string)
        res.status(200).json({
            data: availableSlots,
            // message: 'Available slots retrieved successfully',
        });

    });

    // book a new appointment 



}