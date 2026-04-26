import {
  IsEmail,
  IsOptional,
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

// Spanish NIF (8 digits + letter), CIF (letter + 7 digits + control) or
// NIE (X/Y/Z + 7 digits + letter). Validates length and character set
// without exposing business logic details (OWASP A03).
const TAX_ID_REGEX = /^[A-Z0-9]{8,12}$/;
const TAX_ID_MSG = 'El CIF/NIF no tiene un formato válido';

export class RegisterCompanyDto {
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

  @IsString()
  @MaxLength(160)
  companyName!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(12)
  @Matches(TAX_ID_REGEX, { message: TAX_ID_MSG })
  taxId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  address?: string;
}
