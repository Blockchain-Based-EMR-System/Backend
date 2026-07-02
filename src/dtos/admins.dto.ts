import { DoctorAccountStatus, Gender, Role, NurseAccountStatus } from "@prisma/client";
import { IsEmail, IsNotEmpty, IsString, IsInt, IsOptional } from "class-validator";
import { Type } from "class-transformer";

export class AddUserFromAdminDto {
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

    @IsInt()
    @Type(() => Number)
    @IsOptional()
    public years_of_experience: number;
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

export class NurseFromAdminResponseDto {
    public name: string;
    public email: string;
    public username: string;
    public phone: string;
    public gender: Gender;
    public date_of_birth: Date;
    public isVerified: boolean;
    public hasCompletedProfile?: boolean
    public photoUrl?: string;
    public nurse?: {
        account_status?: NurseAccountStatus;
        years_of_experience?: number;
        brief?: string;
        nationalCardUrl?: string;
        bonusFileUrl?: string;
    };
}