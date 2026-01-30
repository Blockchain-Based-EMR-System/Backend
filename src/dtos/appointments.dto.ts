import { IsBoolean, IsNotEmpty, IsDateString, IsOptional, IsUUID, IsNumber, ValidateIf, IsArray } from 'class-validator';


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

export class RescheduleAppointmentDto {
    @IsDateString()
    @IsNotEmpty()
    newScheduledTime: string;
}

export class RescheduleAppointmentByDoctorDto {
    @IsNumber()
    @IsOptional()
    minutes?: number;

    @IsDateString()
    @IsOptional()
    newScheduledTime?: string;
}

export class BulkRescheduleDto {
    @IsArray()
    @IsUUID('4', { each: true })
    @IsNotEmpty()
    appointmentIds: string[];

    @IsNumber()
    @IsOptional()
    minutes?: number;

    @IsDateString()
    @IsOptional()
    newScheduledTime?: string;

    @IsBoolean()
    @IsOptional()
    keepOriginalSlots?: boolean;
}

export class RescheduleDayDto {
    @IsDateString()
    @IsNotEmpty()
    currentDate: string;

    @IsDateString()
    @IsNotEmpty()
    newDate: string;

    @IsBoolean()
    @IsOptional()
    keepOriginalSlots?: boolean;
}