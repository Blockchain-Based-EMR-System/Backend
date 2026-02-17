import { NurseAccountStatus} from "@prisma/client";

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

