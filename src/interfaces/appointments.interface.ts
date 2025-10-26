import { User } from './users.interface';

export interface Appointment {
    id: string;
    patient_id: string;
    doctor_id: string;
    scheduled_time: Date;
    is_online: boolean;
    is_completed: boolean;
    estimated_time?: number;
    created_at: Date;
    modified_at: Date;
    deleted_at?: Date;

    patient: User;
    doctor: User;
}