import { IsNotEmpty, IsString, MaxLength } from "class-validator";

export class CreateGoogleUsersDto {
    public email: string;
    public name: string;
    public isEmailVerified: boolean;
}

export class UpdateGoogleUserPhoneDto {
    @IsNotEmpty()
    @MaxLength(15)
    @IsString()
    public phone: string;
}