import { IsString, IsEnum, IsOptional, IsUUID } from "class-validator";
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