import { DoctorAccountStatus, AvailabilityType, Gender} from "@prisma/client";
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