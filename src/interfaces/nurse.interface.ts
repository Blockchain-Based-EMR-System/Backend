import { NurseAccountStatus, Gender, AnnouncementStatus, AnnouncementNurseStatus} from "@prisma/client";
import { WorkingDays } from "./doctors.interface";

export interface NurseLoginData {
    id: string,
    name: string,
    email: string,
    username: string,
    phone: string,
    gender: string,
    nurse: {
        account_status: NurseAccountStatus,
    }
}

export interface NurseData {
    id: string;
    name: string;
    email: string;
    phone: string;
    gender: Gender;
    age: number;
    profilePic: string | null;
    years_of_experience: number;
    nationalCardUrl: string;
    brief: string | null;
    bonusFileUrl: string | null;
}

export interface NurseApplications {
  id: string;
  application_status: AnnouncementNurseStatus;
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

export interface NurseSchedule {
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
}