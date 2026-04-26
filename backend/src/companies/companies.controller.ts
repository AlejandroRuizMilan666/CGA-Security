import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { RoleName } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { CompaniesService } from './companies.service';
import { UpdateOwnCompanyDto } from './dto/update-own-company.dto';

@Controller('companies')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Get('me')
  @Roles(RoleName.EMPRESA)
  getOwnCompany(@CurrentUser() currentUser: AuthenticatedUser) {
    return this.companiesService.getOwnCompany(currentUser);
  }

  @Patch('me')
  @Roles(RoleName.EMPRESA)
  updateOwnCompany(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() dto: UpdateOwnCompanyDto,
  ) {
    return this.companiesService.updateOwnCompany(currentUser, dto);
  }

  @Get()
  @Roles(RoleName.ADMIN)
  listCompanies() {
    return this.companiesService.listCompanies();
  }

  @Get(':id')
  @Roles(RoleName.ADMIN)
  getCompanyById(@Param('id', ParseUUIDPipe) companyId: string) {
    return this.companiesService.getCompanyById(companyId);
  }
}
