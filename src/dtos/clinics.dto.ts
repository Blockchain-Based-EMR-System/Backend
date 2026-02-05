import { IsBoolean, IsDate, IsNotEmpty, IsNumber, IsOptional, IsString, Matches } from "class-validator";

export class CreateUpdateClinicRequestDto {
    @IsString()
    @IsNotEmpty()
    public name: string;

    @IsNotEmpty()
    @IsString()
    @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
        message: 'opening_at must be in HH:MM format (e.g., 13:00)'
    })
    public opening_at: string;

    @IsNotEmpty()
    @IsString()
    @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
        message: 'closing_at must be in HH:MM format (e.g., 13:00)'
    })
    public closing_at: string;

    @IsString()
    @IsNotEmpty()
    public address: string;

    @IsOptional()
    @IsString()
    public address_maps_link?: string;

    @IsString()
    @IsNotEmpty()
    public phone: string;

    @IsOptional()
    @IsBoolean()
    public canPayOnline?: boolean;

    @IsNotEmpty()
    @IsNumber()
    fees: number;
}

export class ClinicResponseDto {
    public id: string;
    public name: string;
    public opening_at: string;
    public closing_at: string;
    public address: string;
    public address_maps_link?: string;
    public phone: string;
    public canPayOnline?: boolean;
    public is_active: boolean;
}