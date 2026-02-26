import { Gender } from "@prisma/client";
import { IsString, IsNotEmpty, IsEmail, IsInt, IsOptional } from "class-validator";
import { Type } from "class-transformer";

export class NurseSignupRequestDto {
    @IsString()
    @IsNotEmpty()
    public name: string;

    @IsEmail()
    @IsNotEmpty()
    public email: string;

    @IsString()
    @IsNotEmpty()
    public phone: string;

    @IsString()
    @IsNotEmpty()
    public password: string;

    @IsInt()
    @Type(() => Number)
    @IsNotEmpty()
    public years_of_experience: number;

    @IsString()
    @IsOptional()
    public brief?: string;

    @IsString()
    @IsNotEmpty()
    public gender: Gender;

    @IsString()
    public date_of_birth?: Date;

    nationalCard: Express.Multer.File;
    bonusFile: Express.Multer.File;
}

export class NurseLoginRequestDto {
    @IsNotEmpty()
    public emailOrUsername: string;

    @IsString()
    @IsNotEmpty()
    public password: string;

    @IsString()
    public rememberMe?: boolean;
}

export class NurseSetPasswordRequestDto {
    @IsString()
    @IsNotEmpty()
    public password: string;
}

export class NurseProfilePictureRequestDto {
    profilePicture: Express.Multer.File;
}