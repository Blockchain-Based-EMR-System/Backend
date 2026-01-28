import { IsString, IsNotEmpty, IsDateString, IsOptional, IsUUID } from 'class-validator';


export class BookAppointmentDto {
    @IsUUID()
    @IsNotEmpty()
    doctorId: string;

    @IsUUID()
    @IsOptional()
    clinicId?: string;

    @IsDateString()
    @IsNotEmpty()
    scheduledTime: string;
}


export class GetAvailableDaysDto {
    @IsUUID()
    @IsNotEmpty()
    doctorId: string;

    @IsUUID()
    @IsOptional()
    clinicId?: string;
}

export class GetAvailableSlotsDto {
    @IsUUID()
    @IsNotEmpty()
    doctorId: string;

    @IsDateString()
    @IsNotEmpty()
    date: string;

    @IsUUID()
    @IsOptional()
    clinicId?: string;
}