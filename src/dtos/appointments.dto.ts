import { IsDateString, IsEnum, IsNotEmpty, IsString, Validate, ValidateIf } from "class-validator";

export class GetAvailableDaysDto {
    @IsEnum(['ONLINE', 'OFFLINE'])
    @IsNotEmpty()
    appointment_type: 'ONLINE' | 'OFFLINE';

    @ValidateIf(o => o.appointment_type == 'OFFLINE')
    @IsString()
    @IsNotEmpty()
    clinic_id?: string;

    @IsString()
    @IsNotEmpty()
    doctor_id?: string;
}

export class GetAvailableSlotsDto {
    @IsDateString()
    @IsNotEmpty()
    date: string;
}

export class CreateAppointmentDto {
    @IsDateString()
    @IsNotEmpty()
    scheduled_time: string;
}
