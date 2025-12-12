import { Gender, Role } from "@prisma/client";
import { IsEmail, IsNotEmpty, IsString } from "class-validator";

export class AddAdminFromSuperAdminDto {
    @IsEmail()
    @IsNotEmpty()
    public email: string;

    @IsString()
    @IsNotEmpty()
    public name: string;

    @IsString()
    @IsNotEmpty()
    public phone: string;

    @IsString()
    @IsNotEmpty()
    public password: string;

    @IsString()
    @IsNotEmpty()
    public gender: Gender;

    @IsString()
    @IsNotEmpty()
    public date_of_birth: string;
}

export class AdminFromSuperAdminResponseDto {
    public email: string;
    public name: string;
    public username: string;
    public phone: string;
    public role: Role;
    public gender: Gender;
    public isVerified: boolean;
    public hasCompletedProfile: boolean;
    public date_of_birth: Date;
    public photo_url?: string;
}