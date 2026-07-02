import { DoctorAccountStatus, AvailabilityType, Gender, AnnouncementStatus, DayOfWeek} from "@prisma/client";
import { DoctorClinics } from "./clinics.interface";

export interface Doctor {
  id: string;
  avg_time?: Date | null;
  account_status: DoctorAccountStatus;
  num_of_created_clinics: number;
  availability_type: AvailabilityType;
  present: boolean;
}

export interface DoctorLoginData {
    id: string,
    name: string,
    email: string,
    username: string,
    phone: string,
    gender: string,
    doctor: {
        specialization: string,
        account_status: DoctorAccountStatus
    }
}

export interface DoctorPersonalData {
  id: string;
  name: string;
  gender: Gender;
  age: number;
  specialization: string;
  phone: string;
  fees: number;
  profilePic: string;
  is_online: boolean;
  clinics?: DoctorClinics[]
}

export interface WorkingDays {
  day_of_week: DayOfWeek;
  start_time: string;
  end_time: string;
}

export interface DoctorAnnouncements {
  id: string;
  doctor: {
    id: string;
    name: string;
    gender: Gender;
    profilePic: string;
  };
  clinic: {
    id: string;
    name: string
    address: string;
    address_maps_link: string;
  };
  working_days: WorkingDays[];
  status?: AnnouncementStatus;
  gender?: Gender;
  max_age?: number;
  years_of_experience?: number;
  notes?: string;
}