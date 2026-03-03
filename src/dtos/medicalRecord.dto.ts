import { IsEnum, IsNotEmpty, IsDateString, IsOptional, IsUUID, IsNumber, ValidateIf, IsString, Min, IsInt, Max } from 'class-validator';
import { RecordType } from '@prisma/client';

export class CreateMedicalRecordDto {

    @IsString()
    @IsNotEmpty()
    public name: string;

    @IsEnum(RecordType)
    @IsNotEmpty()
    public type: RecordType;

    @IsUUID()
    @IsNotEmpty()
    public clinicId: string;

    @IsUUID()
    @IsOptional()
    public appointmentId?: string;
}

export class UpdateMedicalRecordDto {

}
