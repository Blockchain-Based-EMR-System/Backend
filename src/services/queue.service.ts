import prisma from '@/config/prisma';
import { HttpException } from "@/exceptions/HttpException";
import { createBilingualError, ErrorMessages } from '@/utils/errorMessages';
import { QueuePosition } from '@/interfaces/queue.interface';
import { DayOfWeek } from '@prisma/client';


export class QueueService {

    public async getQueuePosition(appointmentId: string): Promise<QueuePosition> {
        const appointment = await prisma.appointment.findUnique({
            where: {
                id: appointmentId,
            },
            select: {
                position: true,
                estimated_time: true,
                patients_ahead: true,
            }
        });

        if (!appointment) {
            const error = createBilingualError(404, ErrorMessages.APPOINTMENT_NOT_FOUND);
            throw new HttpException(error.status, error.message, error.messageAr);
        }

        return {
            position: appointment.position,
            estimatedWaitMinutes: appointment.estimated_time,
            patientsAhead: appointment.patients_ahead,
        };
    }

    public async calculateQueuePosition(appointmentId: string): Promise<void> {
        const appointment = await prisma.appointment.findUnique({
            where: {
                id: appointmentId,
            },
            select: {
                doctor_id: true,
                clinic_id: true,
                scheduled_time: true,
                slot_duration: true,
            }
        });

        if (!appointment) {
            const error = createBilingualError(404, ErrorMessages.APPOINTMENT_NOT_FOUND);
            throw new HttpException(error.status, error.message, error.messageAr);
        }

        const dayOfWeek = this.getDayOfWeek(appointment.scheduled_time.getDay());

        const schedule = await prisma.doctorSchedule.findFirst({
            where: {
                doctor_id: appointment.doctor_id,
                clinic_id: appointment.clinic_id,
                day_of_week: dayOfWeek,
                is_active: true,
                deleted_at: null,
            },
            select: {
                buffer_time: true,

            }
        });
        const bufferTime = schedule?.buffer_time || 0;

        const startOfDay = new Date(appointment.scheduled_time);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(appointment.scheduled_time);
        endOfDay.setHours(23, 59, 59, 999);

        const todayAppointments = await prisma.appointment.findMany({
            where: {
                doctor_id: appointment.doctor_id,
                scheduled_time: {
                    gte: startOfDay,
                    lte: endOfDay,
                },
                deleted_at: null,
                status: {in : ['CONFIRMED', 'COMPLETED']}
            },
            orderBy: {
                scheduled_time: 'asc',
            },
            select: {
                id: true,
                scheduled_time: true,
                slot_duration: true,
                status: true,
            }
        });

        const currentIdx = todayAppointments.findIndex(app => app.id === appointmentId);

        if (currentIdx === -1) {
            const error = createBilingualError(404, ErrorMessages.APPOINTMENT_NOT_FOUND);
            throw new HttpException(error.status, error.message, error.messageAr);
        }

        const appointmentsAhead = todayAppointments.slice(0, currentIdx).filter(app => app.status !== 'COMPLETED');

        const patientsAhead = appointmentsAhead.length;
        const position = currentIdx + 1;
        // NOOTEEE --> now time - scheduled time but in mins 

        const estimatedWaitMinutes = appointmentsAhead.reduce((total, app) => total + app.slot_duration + bufferTime, 0);

        this.updateQueueParameters(appointmentId, position, patientsAhead, estimatedWaitMinutes);
    }

    private async updateQueueParameters(appointmentId: string, position: number, patientsAhead: number, estimatedWaitMinutes: number): Promise<void> {
        await prisma.appointment.update({
            where: {
                id: appointmentId,
            },
            data: {
                position,
                patients_ahead: patientsAhead,
                estimated_time: estimatedWaitMinutes,
            },
        });
    }

    public getDayOfWeek(jsDay: number): DayOfWeek {
            const days: DayOfWeek[] = [
                DayOfWeek.SUNDAY,
                DayOfWeek.MONDAY,
                DayOfWeek.TUESDAY,
                DayOfWeek.WEDNESDAY,
                DayOfWeek.THURSDAY,
                DayOfWeek.FRIDAY,
                DayOfWeek.SATURDAY,
            ];
            return days[jsDay];
        }
}
