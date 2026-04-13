import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RoleName } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BootstrapService implements OnModuleInit {
  private readonly logger = new Logger(BootstrapService.name);

  constructor(
    private readonly prismaService: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    await this.ensureRoles();

    if (this.isBootstrapEnabled()) {
      await this.ensureAdminUser();
    }
  }

  private async ensureRoles() {
    await Promise.all(
      Object.values(RoleName).map((roleName) =>
        this.prismaService.role.upsert({
          where: { name: roleName },
          update: {},
          create: { name: roleName },
        }),
      ),
    );

    this.logger.log('Roles base verificados');
  }

  private async ensureAdminUser() {
    const adminEmail =
      this.configService.get<string>('ADMIN_EMAIL')?.toLowerCase() ??
      'admin@cga-security.local';
    const existingAdmin = await this.prismaService.user.findUnique({
      where: { email: adminEmail },
    });

    if (existingAdmin) {
      this.logger.log('Administrador inicial ya existente, bootstrap omitido');
      return;
    }

    const adminRole = await this.prismaService.role.findUnique({
      where: { name: RoleName.ADMIN },
    });

    if (!adminRole) {
      this.logger.error('No se ha encontrado el rol ADMIN para el bootstrap');
      return;
    }

    await this.prismaService.user.create({
      data: {
        email: adminEmail,
        fullName:
          this.configService.get<string>('ADMIN_FULL_NAME') ??
          'Administrador Inicial',
        passwordHash: await bcrypt.hash(
          this.configService.get<string>('ADMIN_PASSWORD') ?? 'ChangeMe123!',
          12,
        ),
        roleId: adminRole.id,
      },
    });

    this.logger.log(`Administrador inicial creado para ${adminEmail}`);
  }

  private isBootstrapEnabled() {
    return (
      (
        this.configService.get<string>('ADMIN_BOOTSTRAP_ENABLED') ?? 'false'
      ).toLowerCase() === 'true'
    );
  }
}
