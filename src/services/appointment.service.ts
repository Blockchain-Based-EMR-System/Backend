import prisma from '@/config/prisma';
import { DayOfWeek } from '@prisma/client';
import { AvailableDay } from '@/interfaces';
import { Service } from 'typedi'; 
import { TimeSlot } from '@/interfaces';
import { logger } from '@/utils/logger';


@Service()
export class AppointmentService {

    public async getAvailableDays(doctorId: string, clinicId: string | null): Promise<AvailableDay[]>{
        const daysAhead = 30
        const availableDays: AvailableDay[] = [];
        const isOnline = true;

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
        const isOnline = true;

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
}