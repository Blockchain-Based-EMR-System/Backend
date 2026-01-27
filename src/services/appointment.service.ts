import prisma from '@/config/prisma';
import { DayOfWeek } from '@prisma/client';
import { AvailableDay } from '@/interfaces';



export class AppointmentService {

    public async getAvailableDays(doctorId: string, clinicId: string | null, isOnline: boolean): Promise<AvailableDay[]>{
        const daysAhead = 60
        const availableDays: AvailableDay[] = [];

        const schedules = await prisma.doctorSchedule.findMany({
            where:{
                doctor_id: doctorId,
                clinic_id: clinicId,
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

        instead of 
        { day_of_week: 'MONDAY', start_time: '09:00', end_time: '17:00', slot_duration: 20, buffer_time: 10 }

         will be:
        'MONDAY' => { start_time: '09:00', end_time: '17:00', ... }
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

    

}
