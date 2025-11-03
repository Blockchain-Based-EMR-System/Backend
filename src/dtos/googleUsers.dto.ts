import { IsNotEmpty, IsString, MaxLength } from "class-validator";

export class CreateGoogleUsersDto {
    public email: string;
    public name: string;
}

export class UpdateGoogleUserPhoneDto {
    @IsNotEmpty()
    @MaxLength(15)
    @IsString()
    public phone: string;
}