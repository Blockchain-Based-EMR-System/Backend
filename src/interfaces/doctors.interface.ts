import { DoctorAccountStatus, AvailabilityType } from "@prisma/client";

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