import { IsDateString, IsOptional, IsString, Length } from 'class-validator';

export class CreateMedicalRecordDto {
  @IsString()
  @Length(3, 64)
  public patientId: string;

  @IsString()
  @Length(1, 64)
  public firstName: string;

  @IsString()
  @Length(1, 64)
  public lastName: string;

  @IsDateString()
  public dateOfBirth: string;

  @IsString()
  @Length(1, 32)
  public gender: string;

  @IsString()
  @Length(1, 8)
  public bloodType: string;

  @IsString()
  @Length(10, 128)
  public ipfsCid: string;

  @IsOptional()
  @IsString()
  public summary?: string;
}

export class UpdateMedicalRecordDto {
  @IsString()
  @Length(1, 64)
  public firstName: string;

  @IsString()
  @Length(1, 64)
  public lastName: string;

  @IsDateString()
  public dateOfBirth: string;

  @IsString()
  @Length(1, 32)
  public gender: string;

  @IsString()
  @Length(1, 8)
  public bloodType: string;

  @IsString()
  @Length(10, 128)
  public ipfsCid: string;

  @IsOptional()
  @IsString()
  public summary?: string;
}
