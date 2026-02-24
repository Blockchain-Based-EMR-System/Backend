import { AvailabilityType, DayOfWeek, Gender } from "@prisma/client";
import { IsString, IsNotEmpty, IsEmail, IsArray, IsOptional, IsInt, IsEnum, ValidateNested, Min } from "class-validator";
import { UpdateUserProfileDto } from "./users.dto";
import { Type } from "class-transformer";


export class DoctorSignupRequestDto {
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

    @IsString()
    @IsNotEmpty()
    public gender: Gender;

    @IsString()
    public date_of_birth?: Date;

    graduationCertificate: Express.Multer.File;
    membershipCard: Express.Multer.File;
    professionalPracticeCard: Express.Multer.File;

    mastersCertificate: Express.Multer.File;
    fellowshipCertificate: Express.Multer.File;
    unionSpecializationCertificate: Express.Multer.File;
    

}

export class DoctorLoginRequestDto {
    @IsNotEmpty()
    public emailOrUsername: string;

    @IsString()
    @IsNotEmpty()
    public password: string;

    @IsString()
    public rememberMe?: boolean;
}

export class DoctorSetPasswordRequestDto {
    @IsString()
    @IsNotEmpty()
    public password: string;
}

export class DoctorProfilePictureRequestDto {
    profilePicture: Express.Multer.File;
}

export class DoctorUpdateProfileRequestDto extends UpdateUserProfileDto {
    @IsString()
    availability_type?: AvailabilityType;
}

export class WorkingDayDto {
    @IsEnum(DayOfWeek)
    @IsNotEmpty()
    public day_of_week: DayOfWeek;

    @IsString()
    @IsNotEmpty()
    public start_time: string;

    @IsString()
    @IsNotEmpty()
    public end_time: string;
}

export class PostAnnouncementDto {
    @IsString()
    @IsNotEmpty()
    public clinic_id: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => WorkingDayDto)
    public working_days: WorkingDayDto[];

    @IsOptional()
    @IsEnum(Gender)
    public gender?: Gender;

    @IsOptional()
    @IsInt()
    @Min(0)
    public max_age?: number;

    @IsOptional()
    @IsInt()
    @Min(0)
    public years_of_experience?: number;

    @IsOptional()
    @IsString()
    public notes?: string;
}

export class EditAnnouncementDto {
    @IsOptional()
    @IsString()
    public clinic_id: string;

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => WorkingDayDto)
    public working_days: WorkingDayDto[];

    @IsOptional()
    @IsEnum(Gender)
    public gender?: Gender;

    @IsOptional()
    @IsInt()
    @Min(0)
    public max_age?: number;

    @IsOptional()
    @IsInt()
    @Min(0)
    public years_of_experience?: number;

    @IsOptional()
    @IsString()
    public notes?: string;
}