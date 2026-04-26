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
import { AdminUpdateUserDto } from './dto/admin-update-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  getOwnProfile(@CurrentUser() currentUser: AuthenticatedUser) {
    return this.usersService.getOwnProfile(currentUser);
  }

  @Patch('me')
  updateOwnProfile(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.usersService.updateOwnProfile(currentUser, dto);
  }

  @Get()
  @Roles(RoleName.ADMIN)
  listUsers() {
    return this.usersService.listUsers();
  }

  @Get(':id')
  @Roles(RoleName.ADMIN)
  getUserById(@Param('id', ParseUUIDPipe) userId: string) {
    return this.usersService.getUserById(userId);
  }

  @Patch(':id')
  @Roles(RoleName.ADMIN)
  adminUpdateUser(
    @Param('id', ParseUUIDPipe) userId: string,
    @Body() dto: AdminUpdateUserDto,
  ) {
    return this.usersService.adminUpdateUser(userId, dto);
  }
}
