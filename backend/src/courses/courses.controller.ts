import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { RoleName } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { CoursesService } from './courses.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';

@Controller('courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Get()
  listPublishedCourses() {
    return this.coursesService.listPublishedCourses();
  }

  @Get('admin/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.ADMIN)
  listAdminCourses() {
    return this.coursesService.listAdminCourses();
  }

  @Get('me/enrollments')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.ALUMNO)
  listOwnEnrollments(@CurrentUser() currentUser: AuthenticatedUser) {
    return this.coursesService.listOwnEnrollments(currentUser);
  }

  @Get(':courseId/progress/me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.ALUMNO)
  getMyProgress(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.coursesService.getMyCourseProgress(courseId, currentUser);
  }

  @Post(':courseId/modules/:moduleId/complete')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.ALUMNO)
  completeModule(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Param('moduleId', ParseUUIDPipe) moduleId: string,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.coursesService.completeModule(courseId, moduleId, currentUser);
  }

  @Get(':slug')
  getCourseBySlug(@Param('slug') slug: string) {
    return this.coursesService.getCourseBySlug(slug);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.ADMIN)
  createCourse(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() dto: CreateCourseDto,
  ) {
    return this.coursesService.createCourse(currentUser, dto);
  }

  @Patch(':courseId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.ADMIN)
  updateCourse(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Body() dto: UpdateCourseDto,
  ) {
    return this.coursesService.updateCourse(courseId, dto);
  }

  @Delete(':courseId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.ADMIN)
  deleteCourse(@Param('courseId', ParseUUIDPipe) courseId: string) {
    return this.coursesService.deleteCourse(courseId);
  }

  @Post(':courseId/enroll')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleName.ALUMNO)
  enrollInCourse(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.coursesService.enrollInCourse(courseId, currentUser);
  }
}
