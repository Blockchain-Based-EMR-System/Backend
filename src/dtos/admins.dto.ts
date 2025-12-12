import { Gender } from "@prisma/client";
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

    @IsString()
    public gender: Gender;

    @IsString()
    @IsNotEmpty()
    @TransformSpecialization() // Converts EN/AR to key before validation
    @IsValidSpecialization({
        message: 'Specialization must be a valid specialization (English, Arabic, or key accepted)'
    })
    public specialization: string;
}