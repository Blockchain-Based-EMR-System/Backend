import { User } from './users.interface';
import { RecordType } from '@prisma/client'; 

export interface MedicalRecord {
  id: string;
  patient_id: string;
  clinic_id: string;
  doctor_id?: string;
  appointment_id?: string;
  name: string;
  cid: string;
  type: RecordType;
  mime_type: string;
}

