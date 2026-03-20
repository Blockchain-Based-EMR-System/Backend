import prisma from '@/config/prisma';
import { DayOfWeek } from '@prisma/client';
import { AvailableDay } from '@/interfaces';
import { Service, Container } from 'typedi';
import { TimeSlot } from '@/interfaces';
import { HttpException } from "@/exceptions/HttpException";
import { createBilingualError, ErrorMessages } from '@/utils/errorMessages';
import { PatientTodayAppointment, DoctorAppointment, DoctorScheduleDay, PatientAppointment, DoctorSchedule, checkExistingAppointments, ConflictingAppointment, DoctorVacations, Vacations, AppointmentData, AppointmentEventData } from '@/interfaces/appointments.interface';
import { QueueService } from './queue.service';
import { start } from 'repl';
import { RtcRole, RtcTokenBuilder } from 'agora-token';
import { Agora_APP_CERTIFICATE, Agora_APP_ID } from '@/config';

@Service()
export class AppointmentService {

    private queueService = new QueueService();

    public async getAvailableDays(doctorId: string, clinicId: string | null): Promise<AvailableDay[]> {
        const daysAhead = 30
        const availableDays: AvailableDay[] = [];

        const schedules = await prisma.doctorSchedule.findMany({
            where: {
                doctor_id: doctorId,
                clinic_id: clinicId,
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

        for (let i = 0; i < daysAhead; i++) {
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

        const now = new Date();
        const { start: today, end: endOfToday } = this.getTodayBoundaries(now);

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
                clinic_id: clinicId,
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

                const nowUTC = new Date();
                const egyptOffset = 2 * 60 * 60 * 1000;
                const now = new Date(nowUTC.getTime() + egyptOffset);
                const isInPast = slotStart <= now;

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
        const existingAppointment = await prisma.appointment.findFirst({
            where: {
                patient_id: patientId,
                doctor_id: doctorId,
                clinic_id: clinicId,
                scheduled_time: scheduledTime,
                deleted_at: null,
            }
        })

        if (existingAppointment) {
            const error = createBilingualError(400, ErrorMessages.APPOINTMENT_ALREADY_EXISTS);
            throw new HttpException(error.status, error.message, error.messageAr);
        }

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
                status: 'CONFIRMED',
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
                        id: true,
                        name: true,
                        photo_url: true,
                    }
                },
                clinic: {
                    select: {
                        id: true,
                        name: true,
                        address: true,
                        address_maps_link: true,
                    }
                }
            },
            orderBy: {
                scheduled_time: 'asc',
            }
        });
        return appointments.map(appointment => ({
            id: appointment.id,
            doctor_id: appointment.doctor.id,
            clinic_id: appointment.clinic ? appointment.clinic.id : null,
            status: appointment.status,
            is_online: appointment.is_online,
            slot_duration: appointment.slot_duration,
            doctor_name: appointment.doctor.name,
            doctor_profile_pic: appointment.doctor.photo_url,
            appointment_date: this.formatDate(appointment.scheduled_time),
            start_time: this.formatTime(appointment.scheduled_time),
            end_time: this.formatTime(appointment.end_time),
            clinic_name: appointment.clinic ? appointment.clinic.name : null,
            clinic_address: appointment.clinic ? appointment.clinic.address : null,
            address_maps_link: appointment.clinic ? appointment.clinic.address_maps_link : null,
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
                        id: true,
                        name: true,
                        photo_url: true,
                    }
                },
                clinic: {
                    select: {
                        id: true,
                        name: true,
                        address: true,
                        address_maps_link: true,
                    }
                }
            }
        });
        if (!appointment) {
            return null;
        }

        return {
            id: appointment.id,
            doctor_id: appointment.doctor.id,
            clinic_id: appointment.clinic ? appointment.clinic.id : null,
            status: appointment.status,
            is_online: appointment.is_online,
            slot_duration: appointment.slot_duration,
            doctor_name: appointment.doctor.name,
            doctor_profile_pic: appointment.doctor.photo_url,
            appointment_date: this.formatDate(appointment.scheduled_time),
            start_time: this.formatTime(appointment.scheduled_time),
            end_time: this.formatTime(appointment.end_time),
            clinic_name: appointment.clinic ? appointment.clinic.name : null,
            clinic_address: appointment.clinic ? appointment.clinic.address : null,
            address_maps_link: appointment.clinic ? appointment.clinic.address_maps_link : null,
        };
    }

    public async getTodayAppointment(patientId: string): Promise<PatientTodayAppointment[]> {
        const result: PatientTodayAppointment[] = [];

        const now = new Date();
        const { start: today, end: endOfToday } = this.getTodayBoundaries(now);

        const appointments = await prisma.appointment.findMany({
            where: {
                patient_id: patientId,
                scheduled_time: {
                    gte: today,
                    lte: endOfToday,
                },
                status: { in: ['CONFIRMED', 'COMPLETED'] },
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
                        id: true,
                        name: true,
                        photo_url: true,
                    }
                },
                clinic: {
                    select: {
                        id: true,
                        name: true,
                        address: true,
                        address_maps_link: true,
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
            const queueParameters = await this.queueService.getQueuePosition(appointment.id);

            result.push({
                id: appointment.id,
                doctor_id: appointment.doctor.id,
                clinic_id: appointment.clinic ? appointment.clinic.id : null,
                status: appointment.status,
                is_online: appointment.is_online,
                slot_duration: appointment.slot_duration,
                doctor_name: appointment.doctor.name,
                doctor_profile_pic: appointment.doctor.photo_url,
                appointment_date: this.formatDate(appointment.scheduled_time),
                start_time: this.formatTime(appointment.scheduled_time),
                end_time: this.formatTime(appointment.end_time),
                clinic_name: appointment.clinic ? appointment.clinic.name : null,
                clinic_address: appointment.clinic ? appointment.clinic.address : null,
                address_maps_link: appointment.clinic ? appointment.clinic.address_maps_link : null,
                position: queueParameters.position,
                estimatedWaitMinutes: queueParameters.estimatedWaitMinutes,
                patientsAhead: queueParameters.patientsAhead
            });
        }

        return result;
    }

    public async rescheduleAppointmentByPatient(patientId: string, appointmentId: string, newScheduledTime: Date): Promise<AppointmentEventData> {
        const appointment = await prisma.appointment.findUnique({
            where: {
                id: appointmentId
            },
            select: {
                id: true,
                patient_id: true,
                doctor_id: true,
                scheduled_time: true,
                deleted_at: true,
                patient: {
                    select: {
                        name: true
                    }
                }
            }
        });

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

        return {
            appointmentId: appointment.id,
            doctorId: appointment.doctor_id,
            patientId: appointment.patient_id,
            patientName: appointment.patient.name,
            appointmentDate: this.formatDate(appointment.scheduled_time),
            startTime: this.formatTime(appointment.scheduled_time),
        };

        // penalty to be added later
    }

    public async rescheduleAppointmentByDoctor(doctorId: string, appointmentId: string, minutes: number): Promise<AppointmentEventData[]> {
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
                id: true,
                patient_id: true,
                doctor_id: true,
                scheduled_time: true,
                patient: {
                    select: {
                        name: true,
                    }
                }
            }
        })

        for (const { id: appointmentId } of appointments) {
            await this.rescheduleSingleAppointment(doctorId, appointmentId, minutes);
        }

        return appointments.map(appointment => {
            const newScheduledTime = new Date(appointment.scheduled_time.getTime() + minutes * 60000);
            return {
                appointmentId: appointment.id,
                doctorId: appointment.doctor_id,
                patientId: appointment.patient_id,
                patientName: appointment.patient.name,
                appointmentDate: this.formatDate(newScheduledTime),
                startTime: this.formatTime(newScheduledTime),
            };
        });

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

            if (isOnline) {
                const error = createBilingualError(403, ErrorMessages.EITHER_ONLINE_OR_OFFLINE);
                throw new HttpException(error.status, error.message, error.messageAr);
            }
        }

        if (!clinicId && !isOnline) {
            const error = createBilingualError(403, ErrorMessages.EITHER_ONLINE_OR_OFFLINE);
            throw new HttpException(error.status, error.message, error.messageAr);
        }

        const startMinutes = this.timeStringToMinutes(startTime);
        const endMinutes = this.timeStringToMinutes(endTime);
        const dayOfWeek = this.getDayOfWeek(workingDay);

        if (startMinutes >= endMinutes) {
            const error = createBilingualError(400, ErrorMessages.END_TIME_BEFORE_START_TIME);
            throw new HttpException(error.status, error.message, error.messageAr);
        }

        // prevent time overlap in the same clinic (on different days)
        if (clinicId) {
            const overlappingClinics = await prisma.doctorSchedule.findMany({
                where: {
                    doctor_id: doctorId,
                    clinic_id: { not: clinicId },
                    day_of_week: dayOfWeek,
                    deleted_at: null
                },
                select: {
                    start_time: true,
                    end_time: true,
                }
            });

            for (const schedule of overlappingClinics) {
                const existingStartMins = this.timeStringToMinutes(schedule.start_time);
                const existingEndMins = this.timeStringToMinutes(schedule.end_time);

                const hasTimeOverlap = (startMinutes < existingEndMins && endMinutes > existingStartMins);
                if (hasTimeOverlap) {
                    const error = createBilingualError(400, ErrorMessages.SCHEDULE_CONFLICT_DIFFERENT_CLINIC);
                    throw new HttpException(error.status, error.message, error.messageAr);
                }
            }
        }

        const sameDaySchedules = await prisma.doctorSchedule.findMany({
            where: {
                doctor_id: doctorId,
                day_of_week: dayOfWeek,
                deleted_at: null
            },
            select: {
                start_time: true,
                end_time: true,
                is_online: true,
                clinic_id: true,
            }
        });

        for (const schedule of sameDaySchedules) {
            if (schedule.is_online === isOnline) {
                continue;
            }

            const existingStartMinutes = this.timeStringToMinutes(schedule.start_time);
            const existingEndMinutes = this.timeStringToMinutes(schedule.end_time);

            const hasTimeOverlap = (startMinutes < existingEndMinutes && endMinutes > existingStartMinutes);

            if (hasTimeOverlap) {
                const error = createBilingualError(400, ErrorMessages.ONLINE_OFFLINE_CONFLICT);
                throw new HttpException(error.status, error.message, error.messageAr);
            }
        }


        const existingSchedule = await prisma.doctorSchedule.findFirst({
            where: {
                doctor_id: doctorId,
                clinic_id: clinicId,
                day_of_week: dayOfWeek,
                deleted_at: null,
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

    public async cancelAppointment(userId: string, appointmentId: string): Promise<AppointmentEventData> {
        // see whether the user is patient or doctor
        const appointment = await prisma.appointment.findUnique({
            where: {
                id: appointmentId
            },
            select: {
                id: true,
                patient_id: true,
                doctor_id: true,
                scheduled_time: true,
                deleted_at: true,
                patient: {
                    select: {
                        name: true
                    }
                }
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

        return {
            appointmentId: appointment.id,
            doctorId: appointment.doctor_id,
            patientId: appointment.patient_id,
            patientName: appointment.patient.name,
            appointmentDate: this.formatDate(appointment.scheduled_time),
            startTime: this.formatTime(appointment.scheduled_time),
        };

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

    public async getAppointmentsByDate(doctorId: string, clinicId: string, date: string): Promise<AppointmentData[]> {
        const requestedDate = new Date(date);

        const startOfDay = new Date(requestedDate);
        startOfDay.setUTCHours(0, 0, 0, 0);

        const endOfDay = new Date(requestedDate);
        endOfDay.setUTCHours(23, 59, 59, 999);

        const appointments = await prisma.appointment.findMany({
            where: {
                doctor_id: doctorId,
                clinic_id: clinicId,
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
                patient: {
                    select: {
                        id: true,
                        name: true,
                        gender: true,
                        phone: true,
                    }
                },
                clinic: {
                    select: {
                        id: true,
                        name: true,
                        address: true,
                        address_maps_link: true,
                    }
                }
            },
            orderBy: {
                scheduled_time: 'asc'
            }
        });

        return appointments.map(appointment => ({
            id: appointment.id,
            patient: {
                id: appointment.patient.id,
                name: appointment.patient.name,
                gender: appointment.patient.gender,
                phone: appointment.patient.phone,
            },
            clinic: {
                id: appointment.clinic.id,
                name: appointment.clinic.name,
                address: appointment.clinic.address,
                address_maps_link: appointment.clinic.address_maps_link,
            },
            status: appointment.status,
            slot_duration: appointment.slot_duration,
            appointment_date: this.formatDate(new Date(appointment.scheduled_time)),
            start_time: this.formatTime(new Date(appointment.scheduled_time)),
            end_time: this.formatTime(new Date(appointment.end_time)),
        }));
    }

    public async completeAppointment(appointmentId: string): Promise<void> {
        const appointment = await prisma.appointment.findUnique({
            where: {
                id: appointmentId,
            },
            select: {
                doctor_id: true,
                scheduled_time: true,
                status: true,
            }
        });

        await this.getAndValidateAppointment(appointmentId, appointment.doctor_id);

        if (appointment.status === 'COMPLETED') {
            const error = createBilingualError(400, ErrorMessages.APPOINTMENT_ALREADY_COMPLETED);
            throw new HttpException(error.status, error.message, error.messageAr);
        }

        const nowUTC = new Date();
        const egyptOffset = 2 * 60 * 60 * 1000;
        const now = new Date(nowUTC.getTime() + egyptOffset);


        if (now < appointment.scheduled_time) {
            const error = createBilingualError(400, ErrorMessages.CANNOT_BE_COMPLETED_BEFORE_SCHEDULED_TIME);
            throw new HttpException(error.status, error.message, error.messageAr);
        }

        await prisma.appointment.update({
            where: {
                id: appointmentId,
                deleted_at: null,
            },
            data: {
                status: 'COMPLETED',
                is_completed: true,
                deleted_at: new Date(),
            }
        })
    }

    public async cancelDoctorVacation(doctorId: string, vacationId: string, scheduleId: string): Promise<void> {
        const schedule = await prisma.doctorSchedule.findUnique({
            where: {
                doctor_id: doctorId,
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
                is_active: true,
                break_start: null,
                break_end: null,
                modified_at: new Date(),
            }
        });

        await prisma.vacation.update({
            where: {
                id: vacationId
            },
            data: {
                deleted_at: new Date(),
                status: 'ENDED',
            }
        });
    }

    public async getDoctorVacations(doctorId: string): Promise<DoctorVacations[]> {
        const inActiveSchedules = await prisma.doctorSchedule.findMany({
            where: {
                doctor_id: doctorId,
                is_active: false,
                break_start: {
                    not: null,
                },
                break_end: {
                    not: null,
                },
                deleted_at: null,
            },
            select: {
                id: true,
                day_of_week: true,
                is_online: true,
                break_start: true,
                break_end: true
            },
            orderBy: {
                break_start: 'asc'
            }
        });

        const vacationGroupsMap = new Map<string, typeof inActiveSchedules>();
        for (const schedule of inActiveSchedules) {
            const key = `${schedule.break_start}_${schedule.break_end}`;
            if (!vacationGroupsMap.has(key)) {
                vacationGroupsMap.set(key, []);
            }
            vacationGroupsMap.get(key)!.push(schedule);
        }


        const doctorVacations: DoctorVacations[] = [];

        for (const [key, schedules] of vacationGroupsMap.entries()) {
            const representativeSchedule = schedules[0];
            const allVacations: Vacations[] = [];

            const vacations = await prisma.vacation.findMany({
                where: {
                    doctor_id: doctorId,
                    start_date: representativeSchedule.break_start,
                    end_date: representativeSchedule.break_end,
                    deleted_at: null,
                },
                select: {
                    id: true,
                    doctor_id: true,
                    schedule_id: true,
                    start_date: true,
                    end_date: true,
                    status: true,
                    schedule: {
                        select: {
                            is_online: true,
                            day_of_week: true,
                            clinic_id: true,
                            clinic: {
                                select: {
                                    name: true,
                                    address: true,
                                }
                            }
                        }
                    }
                }
            });

            for (const vacation of vacations) {
                const breakStartDate = new Date(vacation.start_date);
                breakStartDate.setUTCHours(0, 0, 0, 0);

                const breakEndDate = new Date(vacation.end_date);
                breakEndDate.setUTCHours(23, 59, 59, 999);

                const cancelledAppointments = await prisma.appointment.findMany({
                    where: {
                        doctor_id: doctorId,
                        status: 'CANCELLED',
                        cancelled_by: 'DOCTOR',
                        is_online: vacation.schedule.is_online,
                        scheduled_time: {
                            gte: breakStartDate,
                            lte: breakEndDate,
                        },
                        deleted_at: {
                            not: null
                        }
                    },
                    select: {
                        scheduled_time: true,
                    }
                });
                const filteredCancelled = cancelledAppointments.filter(appointment => {
                    const apptDay = this.getDayOfWeek(appointment.scheduled_time.getUTCDay());
                    return apptDay === vacation.schedule.day_of_week;
                });

                allVacations.push({
                    vacationId: vacation.id,
                    scheduleId: vacation.schedule_id,
                    clinicId: vacation.schedule.clinic_id,
                    clinicName: vacation.schedule.clinic?.name || null,
                    clinicAddress: vacation.schedule.clinic?.address || null,
                    dayOfWeek: vacation.schedule.day_of_week,
                    isOnline: vacation.schedule.is_online,
                    status: vacation.status,
                    cancelledAppointments: filteredCancelled.length,
                })
            }

            doctorVacations.push({
                breakStart: representativeSchedule.break_start,
                breakEnd: representativeSchedule.break_end,
                vacations: allVacations
            });

        }
        return doctorVacations;
    }

    public async getCurrentDoctorSchedule(doctorId: string): Promise<DoctorAppointment[]> {
        const now = new Date();
        const { start: startOfDay, end: endOfDay } = this.getTodayBoundaries(now);

        const appointments = await prisma.appointment.findMany({
            where: {
                doctor_id: doctorId,
                scheduled_time: {
                    gte: startOfDay,
                    lte: endOfDay
                },
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

    public async checkConflictingAppointments(doctorId: string, scheduleId: string, breakStart?: string, breakEnd?: string): Promise<checkExistingAppointments> {
        const conflictingAppointments = await this.getConflictingAppointments(doctorId, scheduleId, breakStart, breakEnd);

        return conflictingAppointments.length > 0
            ? { existing: true, numOfAppointments: conflictingAppointments.length }
            : { existing: false };
    }


    public async handleDoctorVacation(doctorId: string, scheduleId: string, breakStart: string, breakEnd: string): Promise<void> {
        const conflictingAppointments = await this.getConflictingAppointments(doctorId, scheduleId, breakStart, breakEnd)
        const idsToCancel = conflictingAppointments.map(appointment => appointment.id);

        await prisma.appointment.updateMany({
            where: {
                id: { in: idsToCancel },
            },
            data: {
                status: 'CANCELLED',
                cancelled_by: 'DOCTOR',
                deleted_at: new Date(),
                modified_at: new Date(),
            },
        });

        await prisma.doctorSchedule.update({
            where: {
                id: scheduleId,
            },
            data: {
                is_active: false,
                break_start: breakStart,
                break_end: breakEnd,
                modified_at: new Date(),
            },
        });

        await prisma.vacation.create({
            data: {
                doctor_id: doctorId,
                schedule_id: scheduleId,
                start_date: breakStart,
                end_date: breakEnd,
            }

        })
        // DONT FORGET LATER --> notify patients/ penalty
    }


    public async deleteDoctorSchedule(doctorId: string, scheduleId: string): Promise<void> {
        const conflictingAppointments = await this.getConflictingAppointments(doctorId, scheduleId)
        const idsToCancel = conflictingAppointments.map(appointment => appointment.id);

        await prisma.appointment.updateMany({
            where: {
                id: { in: idsToCancel },
            },
            data: {
                status: 'CANCELLED',
                cancelled_by: 'DOCTOR',
                deleted_at: new Date(),
                modified_at: new Date(),
            },
        });

        await prisma.doctorSchedule.update({
            where: {
                id: scheduleId
            },
            data: {
                is_active: false,
                deleted_at: new Date(),
            }
        })
        // DONT FORGET LATER --> notify patients / penalty

    }

    public async getNurseAppointmentsToday(nurseId: string): Promise<AppointmentData[]> {
        const crrentDate = new Date();
        const today = this.formatDate(crrentDate);
        const dayOfWeek = this.getDayOfWeek(crrentDate.getUTCDay());

        const nurseSchedules = await prisma.nurseSchedule.findMany({
            where: {
                nurse_id: nurseId,
                day_of_week: dayOfWeek,
                is_active: true,
                deleted_at: null,
            },
            select: {
                doctor_id: true,
                clinic_id: true
            }
        });

        if (!nurseSchedules.length) {
            return [];
        }

        const allAppointments = await Promise.all(
            nurseSchedules.map(schedule =>
                this.getAppointmentsByDate(schedule.doctor_id, schedule.clinic_id, today)
            )
        );

        return allAppointments.flat();
    }

    public async getAppointmentsForDay(doctorId: string, date: Date): Promise<{ id: string; patient_id: string }[]> {
        const { start: startOfDay, end: endOfDay } = this.getTodayBoundaries(date);

        return prisma.appointment.findMany({
            where: {
                doctor_id: doctorId,
                scheduled_time: {
                    gte: startOfDay,
                    lte: endOfDay
                },
                status: { in: ['CONFIRMED'] },
                deleted_at: null,
            },
            select: {
                id: true,
                patient_id: true

            },
        });
    }

    private async getConflictingAppointments(doctorId: string, scheduleId: string, breakStart?: string, breakEnd?: string): Promise<ConflictingAppointment[]> {
        const schedule = await prisma.doctorSchedule.findUnique({
            where: {
                id: scheduleId
            },
            select: {
                doctor_id: true,
                deleted_at: true,
                is_online: true,
                day_of_week: true
            }
        });

        if (!schedule) {
            const error = createBilingualError(404, ErrorMessages.SCHEDULE_NOT_FOUND);
            throw new HttpException(error.status, error.message, error.messageAr);
        }

        if (schedule.deleted_at) {
            const error = createBilingualError(400, ErrorMessages.SCHEDULE_ALREADY_DELETED);
            throw new HttpException(error.status, error.message, error.messageAr);
        }

        let existingAppointments: { id: string; scheduled_time: Date }[];

        if (breakStart && breakEnd) {
            const vacationStart = new Date(breakStart);
            vacationStart.setUTCHours(0, 0, 0, 0);

            const vacationEnd = new Date(breakEnd);
            vacationEnd.setUTCHours(23, 59, 59, 999);

            existingAppointments = await prisma.appointment.findMany({
                where: {
                    doctor_id: doctorId,
                    status: 'CONFIRMED',
                    deleted_at: null,
                    is_online: schedule.is_online,
                    scheduled_time: {
                        gte: vacationStart,
                        lte: vacationEnd,
                    }
                },
                select: {
                    id: true,
                    scheduled_time: true
                }
            });
        }
        else {
            existingAppointments = await prisma.appointment.findMany({
                where: {
                    doctor_id: doctorId,
                    status: 'CONFIRMED',
                    deleted_at: null,
                    is_online: schedule.is_online,
                },
                select: {
                    id: true,
                    scheduled_time: true
                }
            });
        }

        const confilctingAppointments = existingAppointments.filter((appointment) => {
            const apptDay = this.getDayOfWeek(appointment.scheduled_time.getUTCDay());
            return apptDay === schedule.day_of_week;

        })
        return confilctingAppointments;
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
                patient: {
                    select: {
                        name: true,
                    }
                }
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

    private getTodayBoundaries(date: Date, timezone: string = 'Africa/Cairo'): { start: Date; end: Date } {

        const localDateStr = new Intl.DateTimeFormat('en-CA', {
            timeZone: timezone,
            year: 'numeric', month: '2-digit', day: '2-digit'
        }).format(date);

        const start = new Date(`${localDateStr}T00:00:00+02:00`);
        const end = new Date(`${localDateStr}T23:59:59.999+02:00`);

        return { start, end };
    }

    public async generateAgoraToken(appointmentId: string, userId: string): Promise<string> {
        const appointment = await prisma.appointment.findUnique({
            where: {
                id: appointmentId,
            }
        });

        if (!appointment) {
            const error = createBilingualError(404, ErrorMessages.APPOINTMENT_NOT_FOUND);
            throw new HttpException(error.status, error.message, error.messageAr);
        }

        const appId = Agora_APP_ID;
        const appCertificate = Agora_APP_CERTIFICATE;

        if (!appId || !appCertificate) {
            const error = createBilingualError(500, ErrorMessages.AGORA_CREDENTIALS_NOT_CONFIGURED);
            throw new HttpException(error.status, error.message, error.messageAr);
        }

        const channelName = appointmentId;
        const role = RtcRole.PUBLISHER;
        const expirationTimeInSeconds = 3600; // 1 hour
        const currentTimestamp = Math.floor(Date.now() / 1000);
        const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

        const token = RtcTokenBuilder.buildTokenWithUserAccount(appId, appCertificate, channelName, userId, role, privilegeExpiredTs, privilegeExpiredTs);
        return token;
    }
}