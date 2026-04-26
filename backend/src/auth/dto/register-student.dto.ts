import {
  IsEmail,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

// Password must be 8-128 chars with at least one uppercase letter, one digit
// and one special character. This enforces a minimum complexity baseline
// that significantly reduces the risk of brute-force attacks (OWASP A07).
const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
const PASSWORD_MSG =
  'La contraseña debe tener al menos 8 caracteres, una mayúscula, un número y un carácter especial';

export class RegisterStudentDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  @Matches(PASSWORD_REGEX, { message: PASSWORD_MSG })
  password!: string;

  @IsString()
  @MaxLength(120)
  fullName!: string;
}
