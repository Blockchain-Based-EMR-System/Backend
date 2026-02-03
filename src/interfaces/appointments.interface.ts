import { User } from './users.interface';
import {AppointmentStatus, DayOfWeek} from '@prisma/client'

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
    status: AppointmentStatus;  
    is_online: boolean;  
    slot_duration: number;
    doctor_name: string;
    appointment_date: string;
    start_time: string;
    end_time: string;
    clinic_name: string | null;
    clinic_address: string | null; 
}

export interface PatientTodayAppointment {
    id: string;
    status: AppointmentStatus;  
    is_online: boolean;  
    slot_duration: number;
    doctor_name: string;
    appointment_date: string;
    start_time: string;
    end_time: string;
    clinic_name: string | null;
    clinic_address: string | null; 
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



