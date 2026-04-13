import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, RoleName } from '@prisma/client';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { PrismaService } from '../prisma/prisma.service';
import { AdminUpdateUserDto } from './dto/admin-update-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

type UserWithRelations = Prisma.UserGetPayload<{
  include: { role: true; company: true };
}>;

@Injectable()
export class UsersService {
  constructor(private readonly prismaService: PrismaService) {}

  async getOwnProfile(currentUser: AuthenticatedUser) {
    const user = await this.prismaService.user.findUnique({
      where: { id: currentUser.userId },
      include: { role: true, company: true },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return this.serializeUser(user);
  }

  async updateOwnProfile(
    currentUser: AuthenticatedUser,
    dto: UpdateProfileDto,
  ) {
    const user = await this.prismaService.user.update({
      where: { id: currentUser.userId },
      data: {
        fullName: dto.fullName,
      },
      include: { role: true, company: true },
    });

    return this.serializeUser(user);
  }

  async listUsers() {
    const users = await this.prismaService.user.findMany({
      include: { role: true, company: true },
      orderBy: { createdAt: 'desc' },
    });

    return users.map((user) => this.serializeUser(user));
  }

  async getUserById(userId: string) {
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
      include: { role: true, company: true },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return this.serializeUser(user);
  }

  async adminUpdateUser(userId: string, dto: AdminUpdateUserDto) {
    const existingUser = await this.prismaService.user.findUnique({
      where: { id: userId },
      include: { role: true, company: true },
    });

    if (!existingUser) {
      throw new NotFoundException('Usuario no encontrado');
    }

    let roleId = existingUser.roleId;

    if (dto.role) {
      const targetRole = await this.prismaService.role.findUnique({
        where: { name: dto.role },
      });

      if (!targetRole) {
        throw new NotFoundException('Rol no encontrado');
      }

      if (dto.role === RoleName.EMPRESA && !existingUser.company) {
        throw new ConflictException(
          'No se puede asignar el rol EMPRESA a un usuario sin empresa asociada',
        );
      }

      roleId = targetRole.id;
    }

    const user = await this.prismaService.user.update({
      where: { id: userId },
      data: {
        fullName: dto.fullName,
        isActive: dto.isActive,
        roleId,
      },
      include: { role: true, company: true },
    });

    return this.serializeUser(user);
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
          }
        : null,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
