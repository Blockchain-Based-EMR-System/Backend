import { Appointment } from './appointments.interface';
import { Medication } from './medications.interface';
import { ScanLab } from './scans-labs.interface';
import { ClinicNurse, ClinicDoctor } from './clinics.interface';
import { AuditLog } from './audit-logs.interface';
import { Gender } from '@prisma/client';

export interface User {
  id: string;
  name: string;
  email: string;
  username: string;
  phone: string;
  gender: Gender;
  date_of_birth: Date;
  password_hash: string;
  isVerified: boolean;
  created_at: Date;
  modified_at: Date;
  deleted_at?: Date;

  patient?: Patient;
  doctor?: Doctor;
  appointments_as_patient?: Appointment[];
  appointments_as_doctor?: Appointment[];
  medications_as_patient?: Medication[];
  medications_as_doctor?: Medication[];
  scans_labs_as_patient?: ScanLab[];
  scans_labs_as_doctor?: ScanLab[];
  clinics_as_nurse?: ClinicNurse[];
  audit_logs?: AuditLog[];
  controlled_patients?: Patient[];
}

export interface Patient {
  id: string;
  bc_address: string;
  consent: boolean;
  controlling_nurse_id?: string;

  user: User;
  controlling_nurse_user?: User;
}

export interface Doctor {
  id: string;
  specialization: string;
  avg_time?: Date;

  user: User;
  clinic_doctors?: ClinicDoctor[];
}

