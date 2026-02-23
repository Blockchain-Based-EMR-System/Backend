import { NurseAccountStatus, Gender, AnnouncementStatus} from "@prisma/client";

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