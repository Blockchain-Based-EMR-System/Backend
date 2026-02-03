import { IsBoolean, IsNotEmpty, IsDateString, IsOptional, IsUUID, IsNumber, ValidateIf, IsString, Min, IsInt, Max } from 'class-validator';


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
    minutes: number;
}


export class EnterDoctorScheduleDto {
  @IsUUID('4')
  @IsNotEmpty()
  doctorId: string;

  @IsUUID('4')
  @IsOptional()
  clinicId?: string | null;

  @IsInt()
  @Min(0)
  @Max(6)
  @IsNotEmpty()
  workingDay: number; 

  @IsString()
  @IsNotEmpty()
  startTime: string; 

  @IsString()
  @IsNotEmpty()
  endTime: string;

  @IsInt()
  @IsNotEmpty()
  slotDuration: number; 

  @IsInt()
  @IsOptional()
  bufferTime?: number = 0; 

  @IsBoolean()
  @IsNotEmpty()
  isOnline: boolean;
}