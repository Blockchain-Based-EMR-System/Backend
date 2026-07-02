import { User } from './users.interface';
import { Period, ScanLabType } from './enums.interface';

export interface ScanLab {
  id: string;
  patient_id: string;
  doctor_id: string;
  name: string;
  scheduled_date?: Date;
  scheduled_time?: Date;
  frequency?: number;
  period?: Period;
  description?: string;
  type: ScanLabType;
  created_at: Date;
  modified_at: Date;
  deleted_at?: Date;

  patient?: User;
  doctor?: User;
}
