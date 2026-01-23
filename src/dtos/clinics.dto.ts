import { IsBoolean, IsDate, IsNotEmpty, IsNumber, IsString } from "class-validator";

export class CreateClinicRequestDto {
    @IsString()
    @IsNotEmpty()
    public name: string;

    @IsNotEmpty()
    @IsDate()
    public opening_at: Date;

    @IsNotEmpty()
    @IsDate()
    public closing_at: Date;

    @IsString()
    @IsNotEmpty()
    public address: string;

    @IsString()
    public address_maps_link?: string;

    @IsString()
    @IsNotEmpty()
    public phone: string;

    @IsBoolean()
    public canPayOnline?: boolean;

    @IsNotEmpty()
    @IsNumber()
    fees: number;
}