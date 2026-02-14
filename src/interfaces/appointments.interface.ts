import { User } from './users.interface';
import { AppointmentStatus, DayOfWeek, VacationStatus } from '@prisma/client'

export interface Appointment {
    id: string;
    patient_id: string;
    doctor_id: string;
    clinic_id: string | null;
    scheduled_time: Date;
    slot_duration: number;
    end_time: Date;
    is_online: boolean;
    is_completed: boolean;
    estimated_time?: number;
    status: AppointmentStatus;
    cancelled_by: string | null;
    created_at: Date;
    modified_at: Date;
    deleted_at?: Date;

    patient: User;
    doctor: User;
}

export interface PatientAppointment {
    id: string;
    doctor_id: string;
    clinic_id: string | null;
    status: AppointmentStatus;
    is_online: boolean;
    slot_duration: number;
    doctor_name: string;
    doctor_profile_pic: string;
    appointment_date: string;
    start_time: string;
    end_time: string;
    clinic_name: string | null;
    clinic_address: string | null;
    address_maps_link: string | null;
}

export interface PatientTodayAppointment {
    id: string;
    doctor_id: string;
    clinic_id: string | null;
    status: AppointmentStatus;
    is_online: boolean;
    slot_duration: number;
    doctor_name: string;
    doctor_profile_pic: string;
    appointment_date: string;
    start_time: string;
    end_time: string;
    clinic_name: string | null;
    clinic_address: string | null;
    address_maps_link: string | null;
    position: number;
    estimatedWaitMinutes: number;
    patientsAhead: number;
}

export interface DoctorAppointment {
    id: string;
    status: AppointmentStatus;
    slot_duration: number;
    patient_name: string;
    appointment_date: string;
    start_time: string;
    end_time: string;
    clinic_name: string | null;
    clinic_address: string | null;
}

export interface DoctorScheduleDay {
    date: string;
    displayDate: string;
    appointments: DoctorAppointment[];
}

export interface AvailableDay {
    date: string;
    dayOfWeek: DayOfWeek;
    displayDate: string;
}

export interface TimeSlot {
    start: string;
    end: string;
    available: boolean;
    online: boolean;
}

export interface DoctorSchedule {
    id: string;
    clinicId: string | null;
    dayOfWeek: DayOfWeek;
    startTime: string;
    endTime: string;
    slotDuration: number;
    bufferTime: number;
    isOnline: boolean;
    isActive: boolean;
    breakStart: string | null;
    breakEnd: string | null;
}

export interface checkExistingAppointments {
    existing: boolean,
    numOfAppointments?: number
}

export interface ConflictingAppointment {
  id: string;
  scheduled_time: Date;
}

export interface Vacations {
    vacationId: string;
    scheduleId: string;
    clinicId: string | null;
    clinicName: string | null;  
    clinicAddress: string | null; 
    dayOfWeek: DayOfWeek;
    isOnline: boolean;
    status: VacationStatus;
    cancelledAppointments: number;
}

export interface DoctorVacations {
    breakStart: string;
    breakEnd: string;
    vacations: Vacations[];
}