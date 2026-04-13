import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { RoleName } from '@prisma/client';
import { MailService } from '../mail/mail.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let authService: AuthService;

  const prismaService = {
    $transaction: jest.fn(),
    role: {
      findUnique: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  } as unknown as PrismaService;

  const jwtService = {
    signAsync: jest.fn(),
    verifyAsync: jest.fn(),
  } as unknown as JwtService;

  const configValues: Record<string, string | number> = {
    JWT_REFRESH_SECRET: 'refresh-secret',
    JWT_REFRESH_EXPIRES_IN: '7d',
    RESET_TOKEN_EXPIRES_MINUTES: 30,
    APP_BASE_URL: 'http://localhost:3000',
  };

  const configService = {
    get: jest.fn((key: string) => configValues[key]),
  } as unknown as ConfigService;

  const mailService = {
    sendPasswordResetEmail: jest.fn(),
  } as unknown as MailService;

  beforeEach(() => {
    jest.clearAllMocks();
    authService = new AuthService(
      prismaService,
      jwtService,
      configService,
      mailService,
    );
  });

  it('registers a student and returns both tokens', async () => {
    const createdUser = {
      id: 'user-1',
      email: 'student@example.com',
      fullName: 'Student',
      isActive: true,
      roleId: 'role-1',
      refreshTokenHash: null,
      passwordHash: 'hashed-password',
      resetTokenHash: null,
      resetTokenExpires: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      role: {
        id: 'role-1',
        name: RoleName.ALUMNO,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      company: null,
    };

    (prismaService.$transaction as jest.Mock).mockImplementation(
      async (callback: (prisma: typeof prismaService) => Promise<unknown>) =>
        callback({
          role: {
            findUnique: jest.fn().mockResolvedValue({ id: 'role-1' }),
          },
          user: {
            create: jest.fn().mockResolvedValue(createdUser),
          },
        } as unknown as typeof prismaService),
    );
    (jwtService.signAsync as jest.Mock)
      .mockResolvedValueOnce('access-token')
      .mockResolvedValueOnce('refresh-token');
    (prismaService.user.update as jest.Mock).mockResolvedValue(undefined);

    const result = await authService.registerStudent({
      email: 'student@example.com',
      password: 'ChangeMe123!',
      fullName: 'Student',
    });

    expect(result.accessToken).toBe('access-token');
    expect(result.refreshToken).toBe('refresh-token');
    expect(result.user.role).toBe(RoleName.ALUMNO);
    expect(prismaService.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'user-1' },
        data: expect.objectContaining({
          refreshTokenHash: expect.any(String),
        }),
      }),
    );
  });

  it('rejects refresh when the persisted hash does not match', async () => {
    (jwtService.verifyAsync as jest.Mock).mockResolvedValue({
      sub: 'user-1',
      email: 'student@example.com',
      role: RoleName.ALUMNO,
    });
    (prismaService.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'user-1',
      email: 'student@example.com',
      fullName: 'Student',
      isActive: true,
      passwordHash: 'hashed-password',
      refreshTokenHash: 'different-hash',
      resetTokenHash: null,
      resetTokenExpires: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      role: {
        id: 'role-1',
        name: RoleName.ALUMNO,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      company: null,
    });

    await expect(
      authService.refresh({ refreshToken: 'refresh-token' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('fails to reset password when the token is expired or invalid', async () => {
    (prismaService.user.findFirst as jest.Mock).mockResolvedValue(null);

    await expect(
      authService.resetPassword({
        token: '12345678901234567890123456789012',
        newPassword: 'NewPassword123!',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('sends a recovery email when the user exists', async () => {
    (prismaService.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'user-1',
      email: 'student@example.com',
      fullName: 'Student',
      isActive: true,
    });
    (prismaService.user.update as jest.Mock).mockResolvedValue(undefined);

    await authService.forgotPassword({ email: 'student@example.com' });

    expect(prismaService.user.update).toHaveBeenCalled();
    expect(mailService.sendPasswordResetEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'student@example.com',
        fullName: 'Student',
        resetUrl: expect.stringContaining('/reset-password?token='),
      }),
    );
  });
});
