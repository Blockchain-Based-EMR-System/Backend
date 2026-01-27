import { User } from './users.interface';
import {AppointmentStatus, DayOfWeek} from '@prisma/client'

export interface Appointment {
    id: string;
    patient_id: string;
    doctor_id: string;
    clinic_id: string | null;
    scheduled_time: Date;
    slot_duration: Date;
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

export interface AvailableDay {
  date: string; 
  dayOfWeek: DayOfWeek;
  displayDate: string; 
}

// export interface AvailableSlot {
//   start_time: string; 
//   end_time: string;   
// }

export interface TimeSlot {
    start: string; 
    end: string;
    available: boolean;
}



