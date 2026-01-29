import prisma from '@/config/prisma';
import { DayOfWeek } from '@prisma/client';
import { AvailableDay } from '@/interfaces';
import { Service } from 'typedi'; 
import { TimeSlot } from '@/interfaces';
import { HttpException } from "@/exceptions/HttpException";
import { createBilingualError, ErrorMessages } from '@/utils/errorMessages';
import { PatientAppointment } from '@/interfaces/appointments.interface';

@Service()
export class AppointmentService {

    public async getAvailableDays(doctorId: string, clinicId: string | null): Promise<AvailableDay[]>{
        const daysAhead = 30
        const availableDays: AvailableDay[] = [];
        const isOnline = await this.doctorIsOnline(doctorId);

        if (!isOnline && !clinicId) {
            const error = createBilingualError(400, ErrorMessages.CLINIC_REQUIRED_FOR_OFFLINE);
            throw new HttpException(error.status, error.message, error.messageAr);
        }

        const schedules = await prisma.doctorSchedule.findMany({
            where:{
                doctor_id: doctorId,
                clinic_id: isOnline ? null : clinicId,
                is_active: true,
                deleted_at: null
            },
            select:{
                day_of_week: true,
                start_time: true,
                end_time: true,
                slot_duration: true,
                buffer_time: true
            }
        });

        if (schedules.length === 0){
            return [];
        }

        /* 
        creates a map --> avoid searching through schedules every time we need to check if a doctor works on a specific day
        key = day of week , value = the schedule object for that day

        instead of --> { day_of_week: 'MONDAY', start_time: '09:00', end_time: '17:00', slot_duration: 20, buffer_time: 10 }
        will be --> 'MONDAY' => { start_time: '09:00', end_time: '17:00', ... }
        */
        const scheduleMap = new Map<DayOfWeek, typeof schedules[0]>();
        schedules.forEach(schedule => {
            scheduleMap.set(schedule.day_of_week, schedule);
        });

        const today = new Date();
        today.setHours(0,0,0,0);

        for (let i=1; i<= daysAhead; i++){
            // create a copy from today --> if we used today directly it will be modified to today + 1 --> tomorrow date
            const currentDate = new Date(today);
            currentDate.setDate(today.getDate() + i); // current day now is = today + 1 

            const dayOfWeek = this.getDayOfWeek(currentDate.getDay());
            const schedule = scheduleMap.get(dayOfWeek);

            // skip if doctor doesnt work on this day
            if (!schedule){
                continue;
            }

            const hasAvailableSlots = true;

            if (hasAvailableSlots){
                availableDays.push({
                    date: this.formatDate(currentDate),
                    dayOfWeek: dayOfWeek,
                    displayDate: this.formatDisplayDate(currentDate)
                });
            }
        }
        return availableDays;
    }

    public async getAvailableSlots(doctorId: string, clinicId: string | null, date: string): Promise<Omit<TimeSlot, 'available'>[]>{
        const requestedDate = new Date(date);
        const dayOfWeek = this.getDayOfWeek(requestedDate.getDay());
        const isOnline = await this.doctorIsOnline(doctorId);

        if (!isOnline && !clinicId) {
            const error = createBilingualError(400, ErrorMessages.CLINIC_REQUIRED_FOR_OFFLINE);
            throw new HttpException(error.status, error.message, error.messageAr);
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const requestedDateOnly = new Date(requestedDate);
        requestedDateOnly.setHours(0, 0, 0, 0);
        
        if (requestedDateOnly < today) {
            const error = createBilingualError(400, ErrorMessages.APPOINTMENT_IN_PAST);
            throw new HttpException(error.status, error.message, error.messageAr);
        }

        const schedule = await prisma.doctorSchedule.findFirst({
            where:{
                day_of_week: dayOfWeek,
                doctor_id: doctorId,
                clinic_id: isOnline ? null : clinicId,
                is_active: true,
                deleted_at: null,
            },
            select:{
                start_time: true,
                end_time: true,
                slot_duration: true,
                buffer_time: true,
            }
        });

        if (!schedule) {
            return [];
        }

        const allSlots = this.generateTimeSlots(schedule.start_time, schedule.end_time, schedule.slot_duration, schedule.buffer_time);

        const startOfDay = new Date(requestedDate);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(requestedDate);
        endOfDay.setHours(23, 59, 59, 999);

        const existingAppointments = await prisma.appointment.findMany({
            where: {
                doctor_id: doctorId,
                clinic_id: isOnline ? null : clinicId,
                scheduled_time: {
                    gte: startOfDay,
                    lte: endOfDay,
                },
                status: {
                    in: ['CONFIRMED', 'COMPLETED']
                },
                deleted_at: null,
            },
            select: {
                scheduled_time: true,
                end_time: true,
            }
        });

        const availableSlots = allSlots.filter(slot => {
            const slotStart = this.parseTimeToDate(requestedDate, slot.start);
            const slotEnd   = this.parseTimeToDate(requestedDate, slot.end);

            const isBooked = existingAppointments.some(appointment => {
                const appointmentStart = new Date(appointment.scheduled_time);
                const appointmentEnd = new Date(appointment.end_time);

                return this.doesSlotOverlap(slotStart, slotEnd, appointmentStart, appointmentEnd);
            });

            // check if the slot is in the past (now the time is x, we cant book a slot before x)
            const now = new Date();
            const isInPast = slotEnd <= now;

            return !isBooked && !isInPast;
        });

        return availableSlots;
    }

    public async bookAppointment(patientId: string, doctorId: string, clinicId: string | null, scheduledTime: Date): Promise<void>{
        const isOnline = await this.doctorIsOnline(doctorId);
        if (!isOnline && !clinicId) {
            const error = createBilingualError(400, ErrorMessages.CLINIC_REQUIRED_FOR_OFFLINE);
            throw new HttpException(error.status, error.message, error.messageAr);
        }

        const schedule = await prisma.doctorSchedule.findFirst({
            where:{
                doctor_id: doctorId,
                clinic_id: isOnline ? null : clinicId,
                is_active: true,
                deleted_at: null,
                day_of_week: this.getDayOfWeek(scheduledTime.getDay()),
            },
            select:{
                slot_duration: true,
            }
        });

        const endTime = new Date(scheduledTime.getTime() + schedule.slot_duration * 60000); 

        const appointment = await prisma.appointment.create({
            data:{
                patient_id: patientId,
                doctor_id: doctorId,
                clinic_id: isOnline ? null : clinicId,
                scheduled_time: scheduledTime,
                slot_duration: schedule.slot_duration,        
                end_time: endTime,
                is_online: isOnline,
                estimated_time: schedule.slot_duration,       
            }
        });
    }

    public async getPatientAppointments(patientId: string): Promise<PatientAppointment[]> {
        const appointments = await prisma.appointment.findMany({
            where: {
                patient_id: patientId,
            },
            select: {
                id: true,
                scheduled_time: true,
                status: true,
                is_online: true,
                slot_duration: true,
                end_time: true,
                doctor: {
                    select: {
                        name: true,
                    }
                },
                clinic: {
                    select: {
                        name: true,
                        address: true,
                    }
                }
            }
        });
        return appointments.map(appointment => ({
            id: appointment.id,
            status: appointment.status,
            is_online: appointment.is_online,
            slot_duration: appointment.slot_duration,
            doctor_name: appointment.doctor.name,
            appointment_date: this.formatDate(appointment.scheduled_time),
            start_time: this.formatTime(appointment.scheduled_time),
            end_time: this.formatTime(appointment.end_time),
            clinic_name: appointment.clinic ? appointment.clinic.name : null,
            clinic_address: appointment.clinic ? appointment.clinic.address : null,
        }));
    }

    public async getPatientSelectedAppointment(appointmentId: string, patientId: string): Promise<PatientAppointment | null> {
        const appointment = await prisma.appointment.findFirst({
            where: {
                id: appointmentId,
                patient_id: patientId,
            },
            select: {
                id: true,
                scheduled_time: true,
                status: true,
                is_online: true,
                slot_duration: true,
                end_time: true,
                doctor: {
                    select: {
                        name: true,
                    }
                },
                clinic: {
                    select: {
                        name: true,
                        address: true,
                    }
                }
            }
        });
        if (!appointment) {
            return null;
        }

        return {
            id: appointment.id,
            status: appointment.status,
            is_online: appointment.is_online,
            slot_duration: appointment.slot_duration,
            doctor_name: appointment.doctor.name,
            appointment_date: this.formatDate(appointment.scheduled_time),
            start_time: this.formatTime(appointment.scheduled_time),
            end_time: this.formatTime(appointment.end_time),
            clinic_name: appointment.clinic ? appointment.clinic.name : null,
            clinic_address: appointment.clinic ? appointment.clinic.address : null,
        };
    }

    public async rescheduleAppointmentByPatient(patientId: string, appointmentId: string, newScheduledTime: Date): Promise<void> {
        const slotDuration = await prisma.appointment.findUnique({
            where: {
                id: appointmentId,
                patient_id: patientId,
            },
            select: {
                slot_duration: true,
            },
        });
        const newEndTime = new Date(newScheduledTime.getTime() + slotDuration.slot_duration * 60000);

        await prisma.appointment.update({
            where: {
                id: appointmentId,
                patient_id: patientId,
            },
            data: {
                scheduled_time: newScheduledTime,
                end_time: newEndTime,
            }
        });

        // penalty to be added later
    }

    public async rescheduleAppointmentByDoctor(doctorId: string, appointmentId: string, minutes?: number, newScheduledTime?: Date)  : Promise<void> {
        const appointment = await this.getAndValidateAppointment(appointmentId, doctorId);

        let updatedScheduledTime: Date;
        let updatedEndTime: Date;

        if (minutes){
            updatedScheduledTime = new Date(appointment.scheduled_time.getTime() + minutes * 60000);
            updatedEndTime = new Date(appointment.end_time.getTime() + minutes * 60000);
        } else {
            updatedScheduledTime = newScheduledTime;
            updatedEndTime = new Date(newScheduledTime.getTime() + appointment.slot_duration * 60000);
        }

        await this.validateDoctorAvailability(doctorId, appointment.clinic_id, updatedScheduledTime, updatedEndTime, appointmentId);

        await prisma.appointment.update({
            where: {
                id: appointmentId,
            },
            data: {
                scheduled_time: updatedScheduledTime,
                end_time: updatedEndTime,
                modified_at: new Date(),
            }
        });
    }

    public async bulkRescheduleByDoctor(doctorId: string, appointmentIds: string[], minutes?: number, newBaseDate?: Date, keepOriginalSlots?: boolean): Promise<void> {
        if (minutes) {
            for (const appointmentId of appointmentIds) {
                await this.getAndValidateAppointment(appointmentId, doctorId);
                await this.rescheduleAppointmentByDoctor(doctorId, appointmentId, minutes, undefined);
            }
        }

        if (newBaseDate) {
            if (keepOriginalSlots) {
                for (const appointmentId of appointmentIds) {
                    await this.getAndValidateAppointment(appointmentId, doctorId);

                    const appointment = await prisma.appointment.findUnique({
                        where: { id: appointmentId },
                        select: { scheduled_time: true },
                    });
                    const originalTime = new Date(appointment.scheduled_time);

                    const newScheduledTime = new Date(newBaseDate);
                    newScheduledTime.setHours(originalTime.getHours(), originalTime.getMinutes(), 0, 0);

                    await this.rescheduleAppointmentByDoctor(doctorId, appointmentId, null, newScheduledTime);
                }
            }
            else {
                const appointments = await prisma.appointment.findMany({
                    where: {
                        id: { in: appointmentIds },
                        doctor_id: doctorId,
                        status: { in: ['CONFIRMED'] },
                        deleted_at: null,
                    },
                    select: {
                        id: true,
                        scheduled_time: true,
                        slot_duration: true,
                        clinic_id: true,
                    },
                    orderBy: {
                        scheduled_time: 'asc', 
                    }
                    
                });
                const dayOfWeek = this.getDayOfWeek(newBaseDate.getDay());
                const isOnline = await this.doctorIsOnline(doctorId);
                const clinicId = appointments[0]?.clinic_id || null;

                const schedule = await prisma.doctorSchedule.findFirst({
                    where:{
                        day_of_week: dayOfWeek,
                        doctor_id: doctorId,
                        clinic_id: isOnline ? null : clinicId,
                        is_active: true,
                        deleted_at: null,
                    },
                    select:{
                        slot_duration: true,
                        buffer_time: true,
                    }
                });

                let currentSlotStart = new Date(newBaseDate);

                for (let i = 0; i < appointments.length; i++) {
                    const appointment = appointments[i];
                    await this.getAndValidateAppointment(appointment.id, doctorId);
                    const newScheduledTime = new Date(currentSlotStart);

                    await this.rescheduleAppointmentByDoctor(doctorId, appointment.id, null, newScheduledTime);

                    // move to next slot
                    currentSlotStart = new Date(currentSlotStart.getTime() + (schedule.slot_duration + schedule.buffer_time) * 60000);
                }  
            }
        }     
    }

    public async rescheduleDayAppointments(doctorId: string, currentDate: Date, newDate: Date, keepOriginalSlots: boolean): Promise<void> {

        const startOfDay = new Date(currentDate);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(currentDate);
        endOfDay.setHours(23, 59, 59, 999);

        const appointments = await prisma.appointment.findMany({
            where: {
                doctor_id: doctorId,
                scheduled_time: {
                    gte: startOfDay,
                    lte: endOfDay,
                },
                status: { in: ['CONFIRMED'] },
                deleted_at: null,
            },
            select: {
                id: true,
                scheduled_time: true,
            },
            orderBy: {
                scheduled_time: 'asc', 
            }
        });

        await this.bulkRescheduleByDoctor(doctorId, appointments.map(app => app.id), null, newDate, keepOriginalSlots);
    }

    public async cancelAppointment(userId: string, appointmentId: string): Promise<void> {
        // see whether the user is patient or doctor
        const appointment = await prisma.appointment.findUnique({
            where: {
                id: appointmentId,
            },
            select: {
                id: true,
                patient_id: true,
                doctor_id: true,
                deleted_at: true,
            }
        });

        if (!appointment) {
            const error = createBilingualError(404, ErrorMessages.APPOINTMENT_NOT_FOUND);
            throw new HttpException(error.status, error.message, error.messageAr);
        }

        if (appointment.deleted_at) {
            const error = createBilingualError(400, ErrorMessages.APPOINTMENT_ALREADY_DELETED);
            throw new HttpException(error.status, error.message, error.messageAr);
        }

        if (appointment.patient_id !== userId && appointment.doctor_id !== userId) {
            const error = createBilingualError(403, ErrorMessages.UNAUTHORIZED_APPOINTMENT_ACCESS);
            throw new HttpException(error.status, error.message, error.messageAr);
        }

        await prisma.appointment.update({
            where: {
                id: appointmentId,
            },
            data: {
                cancelled_by: appointment.patient_id === userId ? 'PATIENT' : 'DOCTOR',
                deleted_at: new Date(),
                modified_at: new Date(), 
                status: 'CANCELLED',
            }
        });
        // penalty to be added later
    };

    private generateTimeSlots(startTime: Date, endTime: Date, slotDuration: number, bufferTime: number): Omit<TimeSlot, 'available'>[]{
        const slots: Omit<TimeSlot, 'available'>[] = [];
        const start = new Date(startTime);
        const end = new Date(endTime);
        
        let currentTime = new Date(start);

        while (currentTime < end){
            const slotEnd = new Date(currentTime.getTime() + slotDuration * 60000); 
            if (slotEnd <= end){
                slots.push({
                    start: this.formatTime(currentTime), 
                    end: this.formatTime(slotEnd),      
                });
            }
            // move to next slot (slot duration + buffer time)
            currentTime = new Date(currentTime.getTime() + (slotDuration + bufferTime) * 60000);
        }

        return slots;
    }

    // converts js representation of days (0-6) to prisma's enum
    private getDayOfWeek(jsDay: number): DayOfWeek {
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

    // format date as YYYY-MM-DD
    private formatDate(date: Date): string {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    // format date for display (sun, jan20, 2026)
    private formatDisplayDate(date: Date): string {
        const options: Intl.DateTimeFormatOptions = {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        };
        // later --> for arabic ar-EG
        return date.toLocaleDateString('en-EG', options);
    }

    // extract time from date / ex: 1970-01-01T09:00:00.000Z --> 09:00 
    private formatTime(date: Date): string {
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${hours}:${minutes}`;
    }

    // date: 2026-01-27, time string: 10:30 --> 2026-01-27 10:30:00
    private parseTimeToDate(date: Date, timeStr: string): Date {
        const [hours, minutes] = timeStr.split(':').map(Number);
        const result = new Date(date);
        result.setHours(hours, minutes, 0, 0);
        return result;
    }

    private doesSlotOverlap(slotStart: Date, slotEnd: Date, appointmentStart: Date, appointmentEnd: Date): boolean {
        return (slotStart < appointmentEnd && slotEnd > appointmentStart);
    }

    private async doctorIsOnline(doctorId: string): Promise<boolean> {
        const { availability_type } = await prisma.doctor.findUnique({
            where: {
                id: doctorId,
            },
            select: {
                availability_type: true,
            }
        });
        return availability_type === 'ONLINE' || availability_type === 'BOTH';
    }

    private async getAndValidateAppointment(appointmentId: string, doctorId: string) {
        const appointment = await prisma.appointment.findUnique({
            where: { id: appointmentId },
            select: {
                id: true,
                patient_id: true,
                doctor_id: true,
                clinic_id: true,
                scheduled_time: true,
                end_time: true,
                slot_duration: true,
                status: true,
                deleted_at: true,
            }
        });

        if (!appointment) {
            const error = createBilingualError(404, ErrorMessages.APPOINTMENT_NOT_FOUND);
            throw new HttpException(error.status, error.message, error.messageAr);
        }

        if (appointment.doctor_id !== doctorId) {
            const error = createBilingualError(403, ErrorMessages.UNAUTHORIZED_APPOINTMENT_ACCESS);
            throw new HttpException(error.status, error.message, error.messageAr);
        }

        if (appointment.deleted_at) {
            const error = createBilingualError(400, ErrorMessages.APPOINTMENT_ALREADY_DELETED);
            throw new HttpException(error.status, error.message, error.messageAr);
        }

        return appointment;
    }

    private async validateDoctorAvailability(doctorId: string, clinicId: string | null, newScheduledTime: Date, newEndTime: Date, excludeAppointmentId?: string): Promise<void> {

        // check if doctor works on this day
        const dayOfWeek = this.getDayOfWeek(newScheduledTime.getDay());
        const isOnline = await this.doctorIsOnline(doctorId);

        const schedule = await prisma.doctorSchedule.findFirst({
            where: {
                doctor_id: doctorId,
                clinic_id: isOnline ? null : clinicId,
                day_of_week: dayOfWeek,
                is_active: true,
                deleted_at: null,
            },
            select: {
                start_time: true,
                end_time: true,
            }
        });

        if (!schedule) {
            const error = createBilingualError(400, ErrorMessages.DOCTOR_NOT_WORKING_ON_DAY);
            throw new HttpException(error.status, error.message, error.messageAr);
        }

        // check if the new time within schedule or not
        const scheduleStart = this.parseTimeToDate(newScheduledTime, this.formatTime(schedule.start_time));
        const scheduleEnd = this.parseTimeToDate(newScheduledTime, this.formatTime(schedule.end_time));

        if (newScheduledTime < scheduleStart || newEndTime > scheduleEnd) {
            const error = createBilingualError(400, ErrorMessages.TIME_OUTSIDE_SCHEDULE);
            throw new HttpException(error.status, error.message, error.messageAr);
        }

        // check for any conflicts with existing appointments (appointments on the same calendar day)
        const startOfDay = new Date(newScheduledTime);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(newScheduledTime);
        endOfDay.setHours(23, 59, 59, 999);

        const whereClause: any = {
            doctor_id: doctorId,
            clinic_id: isOnline ? null : clinicId,
            scheduled_time: {
                gte: startOfDay,
                lte: endOfDay,
            },
            status: { in: ['CONFIRMED', 'COMPLETED'] },
            deleted_at: null,
        };

        // exclude the appointment being rescheduled
        if (excludeAppointmentId) {
            whereClause.id = { not: excludeAppointmentId };
        }

        const conflictingAppointments = await prisma.appointment.findMany({
            where: whereClause,
            select: {
                scheduled_time: true,
                end_time: true,
            }
        });

        // check for overlap
        const hasConflict = conflictingAppointments.some(existing => {
            return this.doesSlotOverlap(newScheduledTime,newEndTime, new Date(existing.scheduled_time), new Date(existing.end_time));
        });

        if (hasConflict) {
            const error = createBilingualError(400, ErrorMessages.TIME_SLOT_NOT_AVAILABLE);
            throw new HttpException(error.status, error.message, error.messageAr);
        }
    }
}