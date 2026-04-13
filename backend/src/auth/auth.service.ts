import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Prisma, RoleName } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'crypto';
import type { StringValue } from 'ms';
import { MailService } from '../mail/mail.service';
import { PrismaService } from '../prisma/prisma.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterCompanyDto } from './dto/register-company.dto';
import { RegisterStudentDto } from './dto/register-student.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { AuthenticatedUser } from './interfaces/authenticated-user.interface';
import { JwtPayload } from './interfaces/jwt-payload.interface';

type UserWithRelations = Prisma.UserGetPayload<{
  include: { role: true; company: true };
}>;

@Injectable()
export class AuthService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
  ) {}

  async registerStudent(dto: RegisterStudentDto) {
    try {
      const user = await this.prismaService.$transaction(async (prisma) => {
        const studentRole = await prisma.role.findUnique({
          where: { name: RoleName.ALUMNO },
        });

        if (!studentRole) {
          throw new BadRequestException('El rol ALUMNO no esta inicializado');
        }

        return prisma.user.create({
          data: {
            email: dto.email.toLowerCase(),
            passwordHash: await this.hashPassword(dto.password),
            fullName: dto.fullName,
            roleId: studentRole.id,
          },
          include: { role: true, company: true },
        });
      });

      return this.issueTokensForUser(user);
    } catch (error) {
      this.handlePrismaError(error);
      throw error;
    }
  }

  async registerCompany(dto: RegisterCompanyDto) {
    try {
      const user = await this.prismaService.$transaction(async (prisma) => {
        const companyRole = await prisma.role.findUnique({
          where: { name: RoleName.EMPRESA },
        });

        if (!companyRole) {
          throw new BadRequestException('El rol EMPRESA no esta inicializado');
        }

        const createdUser = await prisma.user.create({
          data: {
            email: dto.email.toLowerCase(),
            passwordHash: await this.hashPassword(dto.password),
            fullName: dto.fullName,
            roleId: companyRole.id,
            company: {
              create: {
                companyName: dto.companyName,
                taxId: dto.taxId,
                phone: dto.phone,
                address: dto.address,
              },
            },
          },
          include: { role: true, company: true },
        });

        return createdUser;
      });

      return this.issueTokensForUser(user);
    } catch (error) {
      this.handlePrismaError(error);
      throw error;
    }
  }

  async login(dto: LoginDto) {
    const user = await this.prismaService.user.findUnique({
      where: { email: dto.email.toLowerCase() },
      include: { role: true, company: true },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Credenciales invalidas');
    }

    const passwordMatches = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );

    if (!passwordMatches) {
      throw new UnauthorizedException('Credenciales invalidas');
    }

    return this.issueTokensForUser(user);
  }

  async refresh(dto: RefreshTokenDto) {
    const payload = await this.verifyRefreshToken(dto.refreshToken);
    const user = await this.prismaService.user.findUnique({
      where: { id: payload.sub },
      include: { role: true, company: true },
    });

    if (!user || !user.isActive || !user.refreshTokenHash) {
      throw new UnauthorizedException('Refresh token inválido');
    }

    if (this.hashOpaqueToken(dto.refreshToken) !== user.refreshTokenHash) {
      throw new UnauthorizedException('Refresh token inválido');
    }

    return this.issueTokensForUser(user);
  }

  async logout(currentUser: AuthenticatedUser) {
    await this.prismaService.user.update({
      where: { id: currentUser.userId },
      data: { refreshTokenHash: null },
    });

    return { message: 'Sesión cerrada correctamente' };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.prismaService.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (!user || !user.isActive) {
      return {
        message:
          'Si el usuario existe, recibira un correo con instrucciones para restablecer la contraseña',
      };
    }

    const rawToken = randomBytes(32).toString('hex');
    const expiresMinutes =
      this.configService.get<number>('RESET_TOKEN_EXPIRES_MINUTES') ?? 30;
    const resetTokenHash = this.hashOpaqueToken(rawToken);
    const resetUrl = `${this.configService.get<string>('APP_BASE_URL')}/reset-password?token=${rawToken}`;

    await this.prismaService.user.update({
      where: { id: user.id },
      data: {
        resetTokenHash,
        resetTokenExpires: new Date(Date.now() + expiresMinutes * 60_000),
      },
    });

    await this.mailService.sendPasswordResetEmail({
      email: user.email,
      fullName: user.fullName,
      resetUrl,
    });

    return {
      message:
        'Si el usuario existe, recibira un correo con instrucciones para restablecer la contraseña',
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const hashedToken = this.hashOpaqueToken(dto.token);
    const user = await this.prismaService.user.findFirst({
      where: {
        resetTokenHash: hashedToken,
        resetTokenExpires: { gt: new Date() },
      },
    });

    if (!user) {
      throw new BadRequestException(
        'El token de recuperación no es válido o ha expirado',
      );
    }

    await this.prismaService.user.update({
      where: { id: user.id },
      data: {
        passwordHash: await this.hashPassword(dto.newPassword),
        refreshTokenHash: null,
        resetTokenHash: null,
        resetTokenExpires: null,
      },
    });

    return { message: 'Contraseña actualizada correctamente' };
  }

  private async issueTokensForUser(user: UserWithRelations) {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role.name,
    };

    const accessToken = await this.jwtService.signAsync(payload);
    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get<string>(
        'JWT_REFRESH_EXPIRES_IN',
      ) as StringValue,
    });

    await this.prismaService.user.update({
      where: { id: user.id },
      data: { refreshTokenHash: this.hashOpaqueToken(refreshToken) },
    });

    return {
      accessToken,
      refreshToken,
      user: this.serializeUser(user),
    };
  }

  private serializeUser(user: UserWithRelations) {
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      isActive: user.isActive,
      role: user.role.name,
      company: user.company
        ? {
            id: user.company.id,
            companyName: user.company.companyName,
            taxId: user.company.taxId,
            phone: user.company.phone,
            address: user.company.address,
          }
        : null,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  private async hashPassword(password: string) {
    return bcrypt.hash(password, 12);
  }

  private hashOpaqueToken(value: string) {
    return createHash('sha256').update(value).digest('hex');
  }

  private async verifyRefreshToken(token: string) {
    try {
      return await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Refresh token invalido');
    }
  }

  private handlePrismaError(error: unknown) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      const targetMeta = error.meta?.target;
      const target = Array.isArray(targetMeta)
        ? targetMeta.join(', ')
        : typeof targetMeta === 'string'
          ? targetMeta
          : 'registro';
      throw new ConflictException(
        `Ya existe un registro con el valor unico: ${target}`,
      );
    }
  }
}
