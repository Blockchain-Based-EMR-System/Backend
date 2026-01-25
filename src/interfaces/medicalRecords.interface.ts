import { User } from './users.interface';
import { RecordType } from '@prisma/client'; 

export interface MedicalRecord {
  id: string;
  patient_id: string;
  doctor_id?: string;
  name: string;
  cid: string;
  type: RecordType;
  created_at: Date;
  modified_at: Date;
  deleted_at?: Date;

  patient?: User;
}

