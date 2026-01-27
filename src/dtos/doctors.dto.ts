import { TransformSpecialization } from "@/utils/specializationTransform";
import { IsValidSpecialization } from "@/validators/specialization.validator";
import { Gender } from "@prisma/client";
import { IsString, IsNotEmpty, IsEmail } from "class-validator";

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