import { User } from './users.interface';
import { Period } from './enums.interface';

export interface Medication {
  id: string;
  patient_id: string;
  doctor_id: string;
  treatment_name: string;
  medication_end_date: Date;
  medication_start_time: Date;
  frequency: number;
  period: Period;
  description?: string;
  created_at: Date;
  modified_at: Date;
  deleted_at?: Date;

  patient?: User;
  doctor?: User;
}
