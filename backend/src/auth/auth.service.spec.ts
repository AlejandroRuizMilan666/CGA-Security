import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { RoleName } from '@prisma/client';
import { MailService } from '../mail/mail.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let authService: AuthService;

  const transactionMock = jest.fn();
  const roleFindUniqueMock = jest.fn();
  const userFindUniqueMock = jest.fn();
  const userFindFirstMock = jest.fn();
  const userCreateMock = jest.fn();
  const userUpdateMock = jest.fn();
  const signAsyncMock = jest.fn();
  const verifyAsyncMock = jest.fn();

  const prismaService = {
    $transaction: transactionMock,
    role: {
      findUnique: roleFindUniqueMock,
    },
    user: {
      findUnique: userFindUniqueMock,
      findFirst: userFindFirstMock,
      create: userCreateMock,
      update: userUpdateMock,
    },
  } as unknown as PrismaService;

  const jwtService = {
    signAsync: signAsyncMock,
    verifyAsync: verifyAsyncMock,
  } as unknown as JwtService;

  const configValues: Record<string, string | number> = {
    JWT_REFRESH_SECRET: 'refresh-secret',
    JWT_REFRESH_EXPIRES_IN: '7d',
    RESET_TOKEN_EXPIRES_MINUTES: 30,
    APP_BASE_URL: 'http://localhost:3000',
  };

  const getConfigMock = jest.fn((key: string) => configValues[key]);
  const sendPasswordResetEmailMock = jest.fn();

  const configService = {
    get: getConfigMock,
  } as unknown as ConfigService;

  const mailService = {
    sendPasswordResetEmail: sendPasswordResetEmailMock,
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

    transactionMock.mockImplementation(
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
    signAsyncMock
      .mockResolvedValueOnce('access-token')
      .mockResolvedValueOnce('refresh-token');
    userUpdateMock.mockResolvedValue(undefined);

    const result: {
      accessToken: string;
      refreshToken: string;
      user: { role: RoleName };
    } = await authService.registerStudent({
      email: 'student@example.com',
      password: 'ChangeMe123!',
      fullName: 'Student',
    });

    expect(result.accessToken).toBe('access-token');
    expect(result.refreshToken).toBe('refresh-token');
    expect(result.user.role).toBe(RoleName.ALUMNO);

    const [firstUpdateCall] = userUpdateMock.mock.calls as Array<
      [
        {
          where: { id: string };
          data: { refreshTokenHash: string };
        },
      ]
    >;

    expect(firstUpdateCall[0].where.id).toBe('user-1');
    expect(typeof firstUpdateCall[0].data.refreshTokenHash).toBe('string');
  });

  it('rejects refresh when the persisted hash does not match', async () => {
    verifyAsyncMock.mockResolvedValue({
      sub: 'user-1',
      email: 'student@example.com',
      role: RoleName.ALUMNO,
    });
    userFindUniqueMock.mockResolvedValue({
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
    userFindFirstMock.mockResolvedValue(null);

    await expect(
      authService.resetPassword({
        token: '12345678901234567890123456789012',
        newPassword: 'NewPassword123!',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('sends a recovery email when the user exists', async () => {
    userFindUniqueMock.mockResolvedValue({
      id: 'user-1',
      email: 'student@example.com',
      fullName: 'Student',
      isActive: true,
    });
    userUpdateMock.mockResolvedValue(undefined);

    await authService.forgotPassword({ email: 'student@example.com' });

    expect(userUpdateMock).toHaveBeenCalled();

    const [firstMailCall] = sendPasswordResetEmailMock.mock.calls as Array<
      [
        {
          email: string;
          fullName: string;
          resetUrl: string;
        },
      ]
    >;

    expect(firstMailCall[0].email).toBe('student@example.com');
    expect(firstMailCall[0].fullName).toBe('Student');
    expect(firstMailCall[0].resetUrl).toContain('/reset-password?token=');
  });
});
