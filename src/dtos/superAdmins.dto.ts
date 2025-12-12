import { Gender } from "@prisma/client";
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