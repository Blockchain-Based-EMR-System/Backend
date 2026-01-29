import { DoctorAccountStatus, Gender, Role } from "@prisma/client";
import { IsEmail, IsNotEmpty, IsString } from "class-validator";
import { IsValidSpecialization } from "@/validators/specialization.validator";
import { TransformSpecialization } from "@/utils/specializationTransform";

export class AddDoctorFromAdminDto {
    @IsEmail()
    @IsNotEmpty()
    public email: string;

    @IsString()
    @IsNotEmpty()
    public name: string;

    @IsString()
    @IsNotEmpty()
    public phone: string;

    @IsNotEmpty()
    public date_of_birth: Date;

    @IsString()
    public gender: Gender;
}

export class DoctorFromAdminResponseDto {
    public name: string;
    public email: string;
    public username: string;
    public phone: string;
    public gender: Gender;
    public date_of_birth: Date;
    public role?: Role;
    public isVerified: boolean;
    public hasCompletedProfile?: boolean
    public photoUrl?: string;
    public doctor?: {
        specialization: string;
        avg_time?: Date;
        account_status?: DoctorAccountStatus;
        fellowshipCertificateUrl?: string;
        graduationCertificateUrl?: string;
        mastersCertificateUrl?: string;
        membershipCardUrl?: string;
        unionSpecializationCertificateUrl?: string;
        professionalPracticeCardUrl?: string;
    };
}