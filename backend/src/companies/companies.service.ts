import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateOwnCompanyDto } from './dto/update-own-company.dto';

type CompanyWithUser = Prisma.CompanyGetPayload<{
  include: { user: { include: { role: true } } };
}>;

@Injectable()
export class CompaniesService {
  constructor(private readonly prismaService: PrismaService) {}

  async getOwnCompany(currentUser: AuthenticatedUser) {
    const company = await this.prismaService.company.findUnique({
      where: { userId: currentUser.userId },
      include: { user: { include: { role: true } } },
    });

    if (!company) {
      throw new NotFoundException(
        'Empresa no encontrada para el usuario actual',
      );
    }

    return this.serializeCompany(company);
  }

  async updateOwnCompany(
    currentUser: AuthenticatedUser,
    dto: UpdateOwnCompanyDto,
  ) {
    try {
      const company = await this.prismaService.company.update({
        where: { userId: currentUser.userId },
        data: {
          companyName: dto.companyName,
          taxId: dto.taxId,
          phone: dto.phone,
          address: dto.address,
        },
        include: { user: { include: { role: true } } },
      });

      return this.serializeCompany(company);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException(
          'Empresa no encontrada para el usuario actual',
        );
      }

      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'Ya existe una empresa con ese identificador fiscal',
        );
      }

      throw error;
    }
  }

  async listCompanies() {
    const companies = await this.prismaService.company.findMany({
      include: { user: { include: { role: true } } },
      orderBy: { createdAt: 'desc' },
    });

    return companies.map((company) => this.serializeCompany(company));
  }

  async getCompanyById(companyId: string) {
    const company = await this.prismaService.company.findUnique({
      where: { id: companyId },
      include: { user: { include: { role: true } } },
    });

    if (!company) {
      throw new NotFoundException('Empresa no encontrada');
    }

    return this.serializeCompany(company);
  }

  private serializeCompany(company: CompanyWithUser) {
    return {
      id: company.id,
      companyName: company.companyName,
      taxId: company.taxId,
      phone: company.phone,
      address: company.address,
      user: {
        id: company.user.id,
        email: company.user.email,
        fullName: company.user.fullName,
        isActive: company.user.isActive,
        role: company.user.role.name,
      },
      createdAt: company.createdAt,
      updatedAt: company.updatedAt,
    };
  }
}
