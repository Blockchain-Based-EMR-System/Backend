import prisma from '@/config/prisma';
import { DayOfWeek } from '@prisma/client';
import { AvailableDay } from '@/interfaces';
import { Service, Container } from 'typedi';
import { TimeSlot } from '@/interfaces';
import { HttpException } from "@/exceptions/HttpException";
import { createBilingualError, ErrorMessages } from '@/utils/errorMessages';
import { PatientTodayAppointment, DoctorAppointment, DoctorScheduleDay, PatientAppointment, DoctorSchedule } from '@/interfaces/appointments.interface';
import { QueueService } from './queue.service';

@Service()
export class AppointmentService {

    private queueService = new QueueService();

    public async getAvailableDays(doctorId: string, clinicId: string | null): Promise<AvailableDay[]> {
        const daysAhead = 30
        const availableDays: AvailableDay[] = [];

        const schedules = await prisma.doctorSchedule.findMany({
            where: {
                doctor_id: doctorId,
                deleted_at: null
            },
            select: {
                day_of_week: true,
                start_time: true,
                end_time: true,
                is_online: true,
                slot_duration: true,
                buffer_time: true,
                is_active: true,
                break_start: true,
                break_end: true,

            }
        });

        if (schedules.length === 0) {
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
        today.setUTCHours(0, 0, 0, 0);

        for (let i = 1; i <= daysAhead; i++) {
            // create a copy from today --> if we used today directly it will be modified to today + 1 --> tomorrow date
            const currentDate = new Date(today);
            currentDate.setUTCDate(today.getUTCDate() + i); // current day now is = today + 1 

            const dayOfWeek = this.getDayOfWeek(currentDate.getUTCDay());
            const schedule = scheduleMap.get(dayOfWeek);

            // skip if doctor doesnt work on this day
            if (!schedule) {
                continue;
            }


            if (!schedule.is_online && !clinicId) {
                const error = createBilingualError(400, ErrorMessages.CLINIC_REQUIRED_FOR_OFFLINE);
                throw new HttpException(error.status, error.message, error.messageAr);
            }

            if (!schedule.is_active) {
                if (schedule.break_start && schedule.break_end) {
                    const breakStart = new Date(schedule.break_start);
                    breakStart.setUTCHours(0, 0, 0, 0);

                    const breakEnd = new Date(schedule.break_end);
                    breakEnd.setUTCHours(23, 59, 59, 999);

                    const currentDateOnly = new Date(currentDate);
                    currentDateOnly.setUTCHours(0, 0, 0, 0);

                    if (currentDateOnly >= breakStart && currentDateOnly <= breakEnd) {
                        continue;
                    }
                }
            }

            const availableSlots = await this.getAvailableSlots(doctorId, clinicId, this.formatDate(currentDate));
            const hasAvailableSlots = availableSlots.length > 0;


            if (hasAvailableSlots) {
                availableDays.push({
                    date: this.formatDate(currentDate),
                    dayOfWeek: dayOfWeek,
                    displayDate: this.formatDisplayDate(currentDate)
                });
            }
        }
        return availableDays;
    }


    public async getAvailableSlots(doctorId: string, clinicId: string | null, date: string): Promise<TimeSlot[]> {
        const requestedDate = new Date(date);
        const dayOfWeek = this.getDayOfWeek(requestedDate.getUTCDay());

        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);

        const requestedDateOnly = new Date(requestedDate);
        requestedDateOnly.setUTCHours(0, 0, 0, 0);

        if (requestedDateOnly < today) {
            const error = createBilingualError(400, ErrorMessages.APPOINTMENT_IN_PAST);
            throw new HttpException(error.status, error.message, error.messageAr);
        }

        const schedules = await prisma.doctorSchedule.findMany({
            where: {
                day_of_week: dayOfWeek,
                doctor_id: doctorId,
                deleted_at: null,
            },
            select: {
                start_time: true,
                end_time: true,
                slot_duration: true,
                buffer_time: true,
                is_online: true,
            },

            orderBy: {
                start_time: 'asc'
            }
        });


        if (schedules.length === 0) {
            return [];
        }
        const startOfDay = new Date(requestedDate);
        startOfDay.setUTCHours(0, 0, 0, 0);

        const endOfDay = new Date(requestedDate);
        endOfDay.setUTCHours(23, 59, 59, 999);

        const existingAppointments = await prisma.appointment.findMany({
            where: {
                doctor_id: doctorId,
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
                is_online: true,
            }
        });

        const allSlots: TimeSlot[] = [];


        for (const schedule of schedules) {
            const isOnline = schedule.is_online;

            if (!schedule.is_online && !clinicId) {
                const error = createBilingualError(400, ErrorMessages.CLINIC_REQUIRED_FOR_OFFLINE);
                throw new HttpException(error.status, error.message, error.messageAr);
            }

            const thisScheduleSlots = this.generateTimeSlots(schedule.start_time, schedule.end_time, schedule.slot_duration, schedule.buffer_time, isOnline);

            const finalSlots = thisScheduleSlots.map(slot => {
                const slotStart = this.parseTimeToDate(requestedDate, slot.start);
                const slotEnd = this.parseTimeToDate(requestedDate, slot.end);

                const isBooked = existingAppointments.some(appt => {
                    const apptStart = new Date(appt.scheduled_time);
                    const apptEnd = new Date(appt.end_time);
                    return this.doesSlotOverlap(slotStart, slotEnd, apptStart, apptEnd);
                });

                const now = new Date();
                const isInPast = slotEnd <= now;

                return {
                    start: slot.start,
                    end: slot.end,
                    available: !isBooked && !isInPast,
                    online: isOnline
                } satisfies TimeSlot;
            });

            allSlots.push(...finalSlots)
        }

        allSlots.sort((a, b) => a.start.localeCompare(b.start));
        return allSlots;

    }

    public async bookAppointment(patientId: string, doctorId: string, clinicId: string | null, scheduledTime: Date): Promise<void> {
        const schedule = await prisma.doctorSchedule.findFirst({
            where: {
                doctor_id: doctorId,
                clinic_id: clinicId,
                is_active: true,
                deleted_at: null,
                day_of_week: this.getDayOfWeek(scheduledTime.getUTCDay()),
            },
            select: {
                slot_duration: true,
                is_online: true,
            }
        });

        if (!schedule) {
            const error = createBilingualError(400, ErrorMessages.DAY_OUTSIDE_SCHEDULE);
            throw new HttpException(error.status, error.message, error.messageAr);
        }

        const isOnline = schedule.is_online;

        if (!isOnline && !clinicId) {
            const error = createBilingualError(400, ErrorMessages.CLINIC_REQUIRED_FOR_OFFLINE);
            throw new HttpException(error.status, error.message, error.messageAr);
        }

        const endTime = new Date(scheduledTime.getTime() + schedule.slot_duration * 60000);


        await prisma.appointment.create({
            data: {
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
            },
            orderBy: {
                scheduled_time: 'asc',
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

    public async getTodayAppointment(patientId: string): Promise<PatientTodayAppointment[]> {
        const result: PatientTodayAppointment[] = [];

        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);

        const endOfToday = new Date();
        endOfToday.setUTCHours(23, 59, 59, 999);

        const appointments = await prisma.appointment.findMany({
            where: {
                patient_id: patientId,
                scheduled_time: {
                    gte: today,
                    lte: endOfToday,
                },
                deleted_at: null,
                status: {
                    in: ['CONFIRMED', 'COMPLETED']
                },

            },
            select: {
                id: true,
                scheduled_time: true,
                status: true,
                is_online: true,
                slot_duration: true,
                end_time: true,
                position: true,
                estimated_time: true,
                patients_ahead: true,
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
            },
            orderBy: {
                scheduled_time: 'asc'
            }
        });

        if (appointments.length === 0) {
            return [];
        }
        for (const appointment of appointments) {
            if (appointment.status === 'CONFIRMED') {
                await this.queueService.calculateQueuePosition(appointment.id);

                const refreshed = await prisma.appointment.findUnique({
                    where: { id: appointment.id },
                    select: {
                        position: true,
                        estimated_time: true,
                        patients_ahead: true,
                    }
                });

                if (refreshed) {
                    appointment.position = refreshed.position;
                    appointment.estimated_time = refreshed.estimated_time;
                    appointment.patients_ahead = refreshed.patients_ahead;
                }
            }

            result.push({
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
                position: appointment.position,              
                estimatedWaitMinutes: appointment.estimated_time,
                patientsAhead: appointment.patients_ahead
            });
        }

        return result;


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

    public async rescheduleAppointmentByDoctor(doctorId: string, appointmentId: string, minutes: number): Promise<void> {
        const appointment = await this.getAndValidateAppointment(appointmentId, doctorId);
        const appointments = await prisma.appointment.findMany({
            where: {
                doctor_id: doctorId,
                status: "CONFIRMED",
                deleted_at: null,
                scheduled_time: {
                    gte: appointment.scheduled_time
                }
            },
            select: {
                id: true
            }
        })

        for (const { id: appointmentId } of appointments) {
            await this.rescheduleSingleAppointment(doctorId, appointmentId, minutes);
        }
    }

    public async enterDoctorSchedule(doctorId: string, clinicId: string | null, workingDay: number, startTime: string, endTime: string, slotDuration: number, bufferTime: number, isOnline: boolean): Promise<void> {
        if (clinicId) {
            const clinic = await prisma.clinic.findUnique({
                where: { id: clinicId },
                select: { id: true }
            });

            if (!clinic) {
                const error = createBilingualError(404, ErrorMessages.CLINIC_NOT_FOUND);
                throw new HttpException(error.status, error.message, error.messageAr);
            }

            const clinicDoctor = await prisma.clinicDoctor.findUnique({
                where: {
                    clinic_id_doctor_id: {
                        clinic_id: clinicId,
                        doctor_id: doctorId
                    }
                }
            });

            if (!clinicDoctor) {
                const error = createBilingualError(403, ErrorMessages.DOCTOR_NOT_ASSOCIATED_WITH_CLINIC);
                throw new HttpException(error.status, error.message, error.messageAr);
            }
        }

        const startMinutes = this.timeStringToMinutes(startTime);
        const endMinutes = this.timeStringToMinutes(endTime);
        const dayOfWeek = this.getDayOfWeek(workingDay);

        if (startMinutes >= endMinutes) {
            const error = createBilingualError(400, ErrorMessages.END_TIME_BEFORE_START_TIME);
            throw new HttpException(error.status, error.message, error.messageAr);
        }

        const existingSchedule = await prisma.doctorSchedule.findFirst({
            where: {
                doctor_id: doctorId,
                clinic_id: clinicId,
                day_of_week: dayOfWeek,
                deleted_at: null
            }
        });

        if (existingSchedule) {
            const error = createBilingualError(400, ErrorMessages.SCHEDULE_ALREADY_EXISTS);
            throw new HttpException(error.status, error.message, error.messageAr);
        }

        await prisma.doctorSchedule.create({
            data: {
                doctor_id: doctorId,
                clinic_id: clinicId,
                day_of_week: dayOfWeek,
                start_time: startTime,
                end_time: endTime,
                slot_duration: slotDuration,
                buffer_time: bufferTime,
                is_online: isOnline,
                is_active: true
            }
        });
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

    public async getUpcommingDoctorSchedule(doctorId: string): Promise<DoctorScheduleDay[]> {
        // to be changed later -->
        const nowUTC = new Date();
        const egyptOffset = 2 * 60 * 60 * 1000; 
        const now = new Date(nowUTC.getTime() + egyptOffset);

        const appointments = await prisma.appointment.findMany({
            where: {
                doctor_id: doctorId,
                scheduled_time: {
                    gte: now,
                },
                status: 'CONFIRMED',
                deleted_at: null,
            },
            orderBy: {
                scheduled_time: 'asc',
            },
            select: {
                id: true,
                scheduled_time: true,
                end_time: true,
                slot_duration: true,
                status: true,
                clinic_id: true,
                patient: {
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

        const groupedByDate = new Map<string, DoctorAppointment[]>();

        appointments.forEach(app => {
            const dateKey = this.formatDate(app.scheduled_time);

            const doctorAppointment: DoctorAppointment = {
                id: app.id,
                status: app.status,
                slot_duration: app.slot_duration,
                patient_name: app.patient.name,
                appointment_date: dateKey,
                start_time: this.formatTime(app.scheduled_time),
                end_time: this.formatTime(app.end_time),
                clinic_name: app.clinic ? app.clinic.name : null,
                clinic_address: app.clinic ? app.clinic.address : null,
            };

            if (!groupedByDate.has(dateKey)) {
                groupedByDate.set(dateKey, []);
            }
            groupedByDate.get(dateKey).push(doctorAppointment);
        });

        const schedule: DoctorScheduleDay[] = [];
        groupedByDate.forEach((appointments, dateKey) => {
            const date = new Date(dateKey + 'T00:00:00.000Z');
            schedule.push({
                date: dateKey,
                displayDate: this.formatDisplayDate(date),
                appointments: appointments,
            });
        });

        return schedule;
    }

    public async getScheduleByDate(doctorId: string, date: string): Promise<DoctorAppointment[]> {
        const requestedDate = new Date(date);

        const startOfDay = new Date(requestedDate);
        startOfDay.setUTCHours(0, 0, 0, 0);

        const endOfDay = new Date(requestedDate);
        endOfDay.setUTCHours(23, 59, 59, 999);

        const appointments = await prisma.appointment.findMany({
            where: {
                doctor_id: doctorId,
                scheduled_time: {
                    gte: startOfDay,
                    lte: endOfDay
                },
                status: {
                    in: ['CONFIRMED', 'COMPLETED']
                },
                deleted_at: null,
            },
            select: {
                id: true,
                scheduled_time: true,
                end_time: true,
                slot_duration: true,
                status: true,
                clinic_id: true,
                patient: {
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
            },
            orderBy: {
                scheduled_time: 'asc'
            }
        });

        return appointments.map(appointment => ({
            id: appointment.id,
            status: appointment.status,
            slot_duration: appointment.slot_duration,
            patient_name: appointment.patient.name,
            appointment_date: this.formatDate(new Date(appointment.scheduled_time)),
            start_time: this.formatTime(new Date(appointment.scheduled_time)),
            end_time: this.formatTime(new Date(appointment.end_time)),
            clinic_name: appointment.clinic?.name || null,
            clinic_address: appointment.clinic?.address || null,
        }));

    }

    public async getCurrentDoctorSchedule(doctorId: string): Promise<DoctorAppointment[]> {
        const startOfDay = new Date();
        startOfDay.setUTCHours(0, 0, 0, 0);

        const endOfDay = new Date();
        endOfDay.setUTCHours(23, 59, 59, 999);

        const appointments = await prisma.appointment.findMany({
            where: {
                doctor_id: doctorId,
                scheduled_time: {
                    gte: startOfDay,
                    lte: endOfDay
                },
                status: 'CONFIRMED',
                deleted_at: null,
            },
            orderBy: {
                scheduled_time: 'asc',
            },
            select: {
                id: true,
                scheduled_time: true,
                end_time: true,
                slot_duration: true,
                status: true,
                clinic_id: true,
                patient: {
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

        return appointments.map(app => ({
            id: app.id,
            status: app.status,
            slot_duration: app.slot_duration,
            patient_name: app.patient.name,
            appointment_date: this.formatDate(app.scheduled_time),
            start_time: this.formatTime(app.scheduled_time),
            end_time: this.formatTime(app.end_time),
            clinic_name: app.clinic ? app.clinic.name : null,
            clinic_address: app.clinic ? app.clinic.address : null,
        }));

    }

    public async getAppointmentOwners(appointmentId: string): Promise<{ doctorId: string; scheduledTime: Date; }> {
        const appointment = await prisma.appointment.findUnique({
            where: {
                id: appointmentId,
                deleted_at: null,
            },
            select: {
                doctor_id: true,
                patient_id: true,
                scheduled_time: true,
            },
        });

        if (!appointment) {
            const error = createBilingualError(404, ErrorMessages.APPOINTMENT_NOT_FOUND);
            throw new HttpException(error.status, error.message, error.messageAr);
        }

        return {
            doctorId: appointment.doctor_id,
            scheduledTime: appointment.scheduled_time,
        };
    }

    public async getDoctorSchedule(doctorId: string): Promise<DoctorSchedule[]> {
        const schedules = await prisma.doctorSchedule.findMany({
            where: {
                doctor_id: doctorId,
                deleted_at: null,
            },
            select: {
                id: true,
                clinic_id: true,
                day_of_week: true,
                start_time: true,
                end_time: true,
                slot_duration: true,
                buffer_time: true,
                is_online: true,
                is_active: true,
                break_start: true,
                break_end: true,
            }
        });

        return schedules.map(schedule => ({
            id: schedule.id,
            clinicId: schedule.clinic_id,
            dayOfWeek: schedule.day_of_week,
            startTime: schedule.start_time,
            endTime: schedule.end_time,
            slotDuration: schedule.slot_duration,
            bufferTime: schedule.buffer_time,
            isOnline: schedule.is_online,
            isActive: schedule.is_active,
            breakStart: schedule.break_start,
            breakEnd: schedule.break_end,
        }));
    }

    public async editDoctorSchedule(doctorId: string, scheduleId: string, updates: any): Promise<void> {
        const schedule = await prisma.doctorSchedule.findUnique({
            where: {
                id: scheduleId
            },
        });

        if (!schedule) {
            const error = createBilingualError(404, ErrorMessages.SCHEDULE_NOT_FOUND);
            throw new HttpException(error.status, error.message, error.messageAr);
        }

        if (schedule.doctor_id !== doctorId) {
            const error = createBilingualError(403, ErrorMessages.UNAUTHORIZED_SCHEDULE_ACCESS);
            throw new HttpException(error.status, error.message, error.messageAr);
        }

        await prisma.doctorSchedule.update({
            where: {
                id: scheduleId
            },
            data: {
                ...updates,
                modified_at: new Date(),
            }
        });
    }

    private generateTimeSlots(startTime: string, endTime: string, slotDuration: number, bufferTime: number, isOnline: boolean): Omit<TimeSlot, 'available'>[] {
        const slots: Omit<TimeSlot, 'available'>[] = [];

        const startMinutes = this.timeStringToMinutes(startTime);
        const endMinutes = this.timeStringToMinutes(endTime);

        let currentMinutes = startMinutes;

        while (currentMinutes < endMinutes) {
            const slotEndMinutes = currentMinutes + slotDuration;
            if (slotEndMinutes <= endMinutes) {
                slots.push({
                    start: this.minutesToTimeString(currentMinutes),
                    end: this.minutesToTimeString(slotEndMinutes),
                    online: isOnline
                });
            }
            // move to next slot (slot duration + buffer time)
            currentMinutes += (slotDuration + bufferTime);
        }

        return slots;
    }

    // converts js representation of days (0-6) to prisma's enum
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

    public convertKeysToSnakeCase<T extends Record<string, any>>(obj: T): Record<string, any> {
        return Object.entries(obj).reduce((acc, [key, value]) => {
            if (value !== undefined) {
                acc[this.camelToSnakeCase(key)] = value;
            }
            return acc;
        }, {} as Record<string, any>);
    }

    // format date as YYYY-MM-DD
    private formatDate(date: Date): string {
        const year = date.getUTCFullYear();
        const month = String(date.getUTCMonth() + 1).padStart(2, '0');
        const day = String(date.getUTCDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    // format date for display (sun, jan20, 2026)
    private formatDisplayDate(date: Date): string {
        const options: Intl.DateTimeFormatOptions = {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            timeZone: 'UTC'
        };
        // later --> for arabic ar-EG
        return date.toLocaleDateString('en-EG', options);
    }

    // extract time from date / ex: 1970-01-01T09:00:00.000Z --> 09:00 
    private formatTime(date: Date): string {
        const hours = String(date.getUTCHours()).padStart(2, '0');
        const minutes = String(date.getUTCMinutes()).padStart(2, '0');
        return `${hours}:${minutes}`;
    }

    // date: 2026-01-27, time string: 10:30 --> 2026-01-27 10:30:00
    private parseTimeToDate(date: Date, timeStr: string): Date {
        const [hours, minutes] = timeStr.split(':').map(Number);
        const result = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0));
        result.setUTCHours(hours, minutes, 0, 0);
        return result;
    }

    // ex: "10:30" --> 630
    private timeStringToMinutes(timeStr: string): number {
        const [hours, minutes] = timeStr.split(':').map(Number);
        return hours * 60 + minutes;
    }

    // "HH:MM" format
    private minutesToTimeString(minutes: number): string {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
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


    private async rescheduleSingleAppointment(doctorId: string, appointmentId: string, minutes: number): Promise<void> {
        const appointment = await this.getAndValidateAppointment(appointmentId, doctorId);

        let updatedScheduledTime: Date;
        let updatedEndTime: Date;

        updatedScheduledTime = new Date(appointment.scheduled_time.getTime() + minutes * 60000);
        updatedEndTime = new Date(appointment.end_time.getTime() + minutes * 60000);

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
        const dayOfWeek = this.getDayOfWeek(newScheduledTime.getUTCDay());
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
        const scheduleStart = this.parseTimeToDate(newScheduledTime, schedule.start_time);
        const scheduleEnd = this.parseTimeToDate(newScheduledTime, schedule.end_time);

        if (newScheduledTime < scheduleStart || newEndTime > scheduleEnd) {
            const error = createBilingualError(400, ErrorMessages.TIME_OUTSIDE_SCHEDULE);
            throw new HttpException(error.status, error.message, error.messageAr);
        }

        // check for any conflicts with existing appointments (appointments on the same calendar day)
        const startOfDay = new Date(newScheduledTime);
        startOfDay.setUTCHours(0, 0, 0, 0);

        const endOfDay = new Date(newScheduledTime);
        endOfDay.setUTCHours(23, 59, 59, 999);

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
            return this.doesSlotOverlap(newScheduledTime, newEndTime, new Date(existing.scheduled_time), new Date(existing.end_time));
        });

        if (hasConflict) {
            const error = createBilingualError(400, ErrorMessages.TIME_SLOT_NOT_AVAILABLE);
            throw new HttpException(error.status, error.message, error.messageAr);
        }
    }

    private camelToSnakeCase(str: string): string {
        return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    }

}