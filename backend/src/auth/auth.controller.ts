import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterCompanyDto } from './dto/register-company.dto';
import { RegisterStudentDto } from './dto/register-student.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import type { AuthenticatedUser } from './interfaces/authenticated-user.interface';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // ── Registration ─────────────────────────────────────────────────────────
  // Strict limit: 5 registrations per IP per minute to block mass account creation
  @Post('register/student')
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ api: { ttl: 60_000, limit: 5 } })
  registerStudent(@Body() dto: RegisterStudentDto) {
    return this.authService.registerStudent(dto);
  }

  @Post('register/company')
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ api: { ttl: 60_000, limit: 5 } })
  registerCompany(@Body() dto: RegisterCompanyDto) {
    return this.authService.registerCompany(dto);
  }

  // ── Login ──────────────────────────────────────────────────────────────
  // 5 attempts per IP per minute mitigates brute-force attacks (OWASP A07)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ api: { ttl: 60_000, limit: 5 } })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  // ── Token refresh ──────────────────────────────────────────────────────
  // Slightly more permissive than login but still rate-limited
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @Throttle({ api: { ttl: 60_000, limit: 10 } })
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refresh(dto);
  }

  // ── Password recovery ────────────────────────────────────────────────
  // Very strict: 3 per minute prevents password-reset email flooding
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @Throttle({ api: { ttl: 60_000, limit: 3 } })
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @Throttle({ api: { ttl: 60_000, limit: 5 } })
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  logout(@CurrentUser() currentUser: AuthenticatedUser) {
    return this.authService.logout(currentUser);
  }
}
