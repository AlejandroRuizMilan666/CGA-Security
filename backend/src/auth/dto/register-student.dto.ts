import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class RegisterStudentDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password!: string;

  @IsString()
  @MaxLength(120)
  fullName!: string;
}
