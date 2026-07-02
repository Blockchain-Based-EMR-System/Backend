import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateMedicalRecordDto {

    @IsUUID()
    @IsNotEmpty()
    public patientId: string;

    @IsUUID()
    @IsNotEmpty()
    public recordId: string;

    @IsUUID()
    @IsNotEmpty()
    public doctorId: string;

    @IsString()
    @IsNotEmpty()
    public type: string;

    @IsString()
    @IsNotEmpty()
    public ipfsCidKey: string;
}

export class UpdateMedicalRecordDto {

    @IsUUID()
    @IsNotEmpty()
    public recordId: string;

    @IsUUID()
    @IsNotEmpty()
    public doctorId: string;

    @IsString()
    @IsNotEmpty()
    public type: string;

    @IsString()
    @IsOptional()
    public ipfsCidKey?: string;
}
