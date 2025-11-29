import { Gender } from '@prisma/client';
import { IsEmail, IsString, IsNotEmpty, MinLength, MaxLength, IsDateString, IsBoolean, IsOptional } from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  public email: string;

  @IsString()
  @IsNotEmpty()
  public name: string;
  
  @IsString()
  @IsNotEmpty()
  public phone: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(32)
  public password: string;
}

export class LoginUserDto {
  @IsString()
  @IsNotEmpty()
  public emailOrUsername: string;
  
  @IsString()
  @IsNotEmpty()
  public password: string;

  @IsBoolean()
  public rememberMe: boolean;
}

export class UpdateUserDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(9)
  @MaxLength(32)
  public password: string;
}

export class CompleteUserProfileDto {

  @IsString()
  @IsNotEmpty()
  public gender: Gender;

  @IsNotEmpty()
  @IsDateString()
  public date_of_birth: string;
}

export class ResetPasswordDto {
  @IsString()
  @IsNotEmpty()
  public token: string;
  
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(32)
  public newPassword: string;
}