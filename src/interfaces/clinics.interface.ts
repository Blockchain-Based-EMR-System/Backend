import { User, Doctor } from './users.interface';

export interface Clinic {
  id: string;
  is_active: boolean;
  opening_at: Date;
  closing_at: Date;
  address: string;
  created_at: Date;
  modified_at: Date;
  deleted_at?: Date;

  clinic_nurses?: ClinicNurse[];
  clinic_doctors?: ClinicDoctor[];
}

export interface ClinicNurse {
  id: string;
  clinic_id: string;
  nurse_id: string;

  clinic: Clinic;
  nurse: User;
}

export interface ClinicDoctor {
  id: string;
  clinic_id: string;
  doctor_id: string;

  clinic: Clinic;
  doctor: Doctor;
}
