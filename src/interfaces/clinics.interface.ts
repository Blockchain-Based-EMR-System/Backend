import { User, Doctor } from './users.interface';
import { DoctorPersonalData } from './doctors.interface';

export interface Clinic {
  id: string;
  name: string;
  phone: string;
  canPayOnline?: boolean;
  is_active: boolean;
  opening_at: string;
  closing_at: string;
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

export interface DoctorClinics {
  id: string;
  name: string;
  phone: string;
  canPayOnline: boolean;
  opening_at: string;
  closing_at: string;
  address: string;
  address_maps_link: string;
  doctors?: Partial<DoctorPersonalData>[];
}