import { IsString, IsEnum, IsOptional, IsUUID, IsObject } from "class-validator";
import { RecordType } from "@/interfaces/enums.interface";


// checks data when a patient uploads any MR
export class CreateMedicalRecordDto {
    @IsString()
    name: string;

    @IsEnum(RecordType)
    type: RecordType;

    @IsOptional()
    @IsUUID()
    doctor_id?: string;

}

// checks data when a doctor submits a JSON-based medical record
export class CreateDoctorRecordJsonDto {
    @IsString()
    name: string;

    @IsEnum(RecordType)
    type: RecordType;

    @IsObject()
    content: Record<string, any>;
}

// permissions --> later 

// checks data when searching/filtering MR
export class GetMedicalRecordsDto {
    @IsOptional()
    @IsEnum(RecordType)
    type?: RecordType;

    @IsOptional()
    @IsUUID()
    doctor_id?: string;
}