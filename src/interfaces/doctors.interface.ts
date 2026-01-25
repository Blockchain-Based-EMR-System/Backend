import { DoctorAccountStatus } from "@prisma/client";

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