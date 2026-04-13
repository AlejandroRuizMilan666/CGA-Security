import { ConflictException, NotFoundException } from '@nestjs/common';
import { RoleName } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from './users.service';

describe('UsersService', () => {
  let usersService: UsersService;

  const prismaService = {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
    role: {
      findUnique: jest.fn(),
    },
  } as unknown as PrismaService;

  beforeEach(() => {
    jest.clearAllMocks();
    usersService = new UsersService(prismaService);
  });

  it('returns the own profile when the user exists', async () => {
    (prismaService.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'user-1',
      email: 'student@example.com',
      fullName: 'Student',
      isActive: true,
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

    const profile = await usersService.getOwnProfile({
      userId: 'user-1',
      email: 'student@example.com',
      role: RoleName.ALUMNO,
    });

    expect(profile.email).toBe('student@example.com');
    expect(profile.role).toBe(RoleName.ALUMNO);
  });

  it('throws when the user does not exist', async () => {
    (prismaService.user.findUnique as jest.Mock).mockResolvedValue(null);

    await expect(
      usersService.getUserById('missing-user'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects assigning EMPRESA role without a company record', async () => {
    (prismaService.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'user-2',
      email: 'plain@example.com',
      fullName: 'Plain User',
      isActive: true,
      roleId: 'role-2',
      createdAt: new Date(),
      updatedAt: new Date(),
      role: {
        id: 'role-2',
        name: RoleName.ALUMNO,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      company: null,
    });
    (prismaService.role.findUnique as jest.Mock).mockResolvedValue({
      id: 'role-company',
      name: RoleName.EMPRESA,
    });

    await expect(
      usersService.adminUpdateUser('user-2', { role: RoleName.EMPRESA }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
