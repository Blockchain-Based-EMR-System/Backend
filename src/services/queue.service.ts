import prisma from '@/config/prisma';
import { HttpException } from "@/exceptions/HttpException";
import { createBilingualError, ErrorMessages } from '@/utils/errorMessages';
import { QueuePosition } from '@/interfaces/queue.interface';
import { AppointmentService } from './appointment.service';

export class QueueService {

    private appointmentService = new AppointmentService();

    public async calculateQueuePosition(appointmentId: string): Promise<QueuePosition> {
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

        const dayOfWeek = this.appointmentService.getDayOfWeek(appointment.scheduled_time.getDay());

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
        const estimatedWaitMinutes = appointmentsAhead.reduce((total, app) => total + app.slot_duration + bufferTime, 0);

        return {
            position,
            estimatedWaitMinutes,
            patientsAhead,
        };



    }
}
