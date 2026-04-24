import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PaymentStatus, Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateCourseDto,
  CreateCourseModuleDto,
} from './dto/create-course.dto';
import {
  UpdateCourseDto,
  UpdateCourseModuleDto,
} from './dto/update-course.dto';

type CourseWithRelations = Prisma.CourseGetPayload<{
  include: {
    modules: true;
    createdBy: true;
    enrollments: {
      include: {
        progressEntries: true;
      };
    };
  };
}>;

@Injectable()
export class CoursesService {
  constructor(private readonly prismaService: PrismaService) {}

  async listPublishedCourses() {
    const courses = await this.prismaService.course.findMany({
      where: { isPublished: true },
      include: {
        modules: {
          orderBy: { position: 'asc' },
        },
        createdBy: true,
        enrollments: {
          include: { progressEntries: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return courses.map((course) => this.serializeCourse(course));
  }

  async listAdminCourses() {
    const courses = await this.prismaService.course.findMany({
      include: {
        modules: {
          orderBy: { position: 'asc' },
        },
        createdBy: true,
        enrollments: {
          include: { progressEntries: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return courses.map((course) => this.serializeCourse(course));
  }

  async getCourseBySlug(slug: string) {
    const course = await this.prismaService.course.findUnique({
      where: { slug },
      include: {
        modules: {
          orderBy: { position: 'asc' },
        },
        createdBy: true,
        enrollments: {
          include: { progressEntries: true },
        },
      },
    });

    if (!course || !course.isPublished) {
      throw new NotFoundException('Curso no encontrado');
    }

    return this.serializeCourse(course);
  }

  async createCourse(currentUser: AuthenticatedUser, dto: CreateCourseDto) {
    try {
      const slug = await this.generateUniqueSlug(dto.slug ?? dto.title);
      const modules = this.normalizeModules(dto.modules ?? []);

      const course = await this.prismaService.course.create({
        data: {
          title: dto.title,
          slug,
          description: dto.description,
          price: dto.price,
          isPublished: dto.isPublished ?? false,
          createdById: currentUser.userId,
          modules: modules.length > 0 ? { create: modules } : undefined,
        },
        include: {
          modules: { orderBy: { position: 'asc' } },
          createdBy: true,
          enrollments: { include: { progressEntries: true } },
        },
      });

      return this.serializeCourse(course);
    } catch (error) {
      this.handlePrismaError(error);
      throw error;
    }
  }

  async updateCourse(courseId: string, dto: UpdateCourseDto) {
    try {
      const existingCourse = await this.prismaService.course.findUnique({
        where: { id: courseId },
      });

      if (!existingCourse) {
        throw new NotFoundException('Curso no encontrado');
      }

      const data: Prisma.CourseUpdateInput = {
        title: dto.title,
        description: dto.description,
        price: dto.price,
        isPublished: dto.isPublished,
      };

      if (dto.slug || dto.title) {
        data.slug = await this.generateUniqueSlug(
          dto.slug ?? dto.title ?? existingCourse.slug,
          courseId,
        );
      }

      if (dto.modules) {
        data.modules = {
          deleteMany: {},
          create: this.normalizeModules(dto.modules),
        };
      }

      const updatedCourse = await this.prismaService.course.update({
        where: { id: courseId },
        data,
        include: {
          modules: { orderBy: { position: 'asc' } },
          createdBy: true,
          enrollments: { include: { progressEntries: true } },
        },
      });

      return this.serializeCourse(updatedCourse);
    } catch (error) {
      this.handlePrismaError(error);
      throw error;
    }
  }

  async deleteCourse(courseId: string) {
    try {
      await this.prismaService.course.delete({
        where: { id: courseId },
      });

      return { message: 'Curso eliminado correctamente' };
    } catch (error) {
      this.handlePrismaError(error);
      throw error;
    }
  }

  async enrollInCourse(courseId: string, currentUser: AuthenticatedUser) {
    const course = await this.prismaService.course.findUnique({
      where: { id: courseId },
      include: { modules: true },
    });

    if (!course || !course.isPublished) {
      throw new NotFoundException('Curso no disponible para inscripcion');
    }

    try {
      const enrollment = await this.prismaService.enrollment.create({
        data: {
          userId: currentUser.userId,
          courseId: course.id,
          paymentStatus: PaymentStatus.COMPLETED,
          paymentReference: `SIM-${randomUUID()}`,
          progressEntries:
            course.modules.length > 0
              ? {
                  create: course.modules.map((module) => ({
                    courseModuleId: module.id,
                    completed: false,
                  })),
                }
              : undefined,
        },
        include: {
          course: {
            include: { modules: { orderBy: { position: 'asc' } } },
          },
          progressEntries: true,
        },
      });

      return {
        message: 'Inscripcion simulada completada correctamente',
        enrollmentId: enrollment.id,
        paymentStatus: enrollment.paymentStatus,
        course: {
          id: enrollment.course.id,
          title: enrollment.course.title,
          slug: enrollment.course.slug,
        },
      };
    } catch (error) {
      this.handlePrismaError(error);
      throw error;
    }
  }

  async listOwnEnrollments(currentUser: AuthenticatedUser) {
    const enrollments = await this.prismaService.enrollment.findMany({
      where: { userId: currentUser.userId },
      include: {
        course: {
          include: {
            modules: { orderBy: { position: 'asc' } },
          },
        },
        progressEntries: true,
      },
      orderBy: { enrolledAt: 'desc' },
    });

    return enrollments.map((enrollment) => {
      const totalModules = enrollment.course.modules.length;
      const completedModules = enrollment.progressEntries.filter(
        (entry) => entry.completed,
      ).length;

      return {
        id: enrollment.id,
        paymentStatus: enrollment.paymentStatus,
        paymentReference: enrollment.paymentReference,
        enrolledAt: enrollment.enrolledAt,
        progressPercent:
          totalModules === 0
            ? 0
            : Math.round((completedModules / totalModules) * 100),
        course: {
          id: enrollment.course.id,
          title: enrollment.course.title,
          slug: enrollment.course.slug,
          description: enrollment.course.description,
          price: enrollment.course.price,
          isPublished: enrollment.course.isPublished,
          enrollmentCount: 0,
          modules: enrollment.course.modules.map((m) => ({
            id: m.id,
            title: m.title,
            description: m.description,
            type: m.type,
            contentUrl: m.contentUrl,
            position: m.position,
          })),
        },
      };
    });
  }

  async getMyCourseProgress(courseId: string, currentUser: AuthenticatedUser) {
    const enrollment = await this.prismaService.enrollment.findFirst({
      where: {
        courseId,
        userId: currentUser.userId,
      },
      include: {
        course: {
          include: {
            modules: { orderBy: { position: 'asc' } },
          },
        },
        progressEntries: true,
      },
    });

    if (!enrollment) {
      throw new NotFoundException('No existe inscripcion para este curso');
    }

    const totalModules = enrollment.course.modules.length;
    const completedModules = enrollment.progressEntries.filter(
      (entry) => entry.completed,
    ).length;

    const progressPercent =
      totalModules === 0
        ? 0
        : Math.round((completedModules / totalModules) * 100);

    return {
      enrollment: {
        id: enrollment.id,
        paymentStatus: enrollment.paymentStatus,
      },
      course: {
        id: enrollment.course.id,
        title: enrollment.course.title,
        slug: enrollment.course.slug,
        description: enrollment.course.description,
        price: enrollment.course.price,
        isPublished: enrollment.course.isPublished,
        enrollmentCount: 0,
        modules: enrollment.course.modules.map((m) => ({
          id: m.id,
          title: m.title,
          description: m.description,
          type: m.type,
          contentUrl: m.contentUrl,
          position: m.position,
        })),
      },
      progressPercent,
      modules: enrollment.course.modules.map((module) => {
        const entry = enrollment.progressEntries.find(
          (e) => e.courseModuleId === module.id,
        );
        return {
          id: entry?.id ?? module.id,
          courseModuleId: module.id,
          completed: entry?.completed ?? false,
          completedAt: entry?.completedAt ?? null,
          module: {
            id: module.id,
            title: module.title,
            description: module.description,
            type: module.type,
            contentUrl: module.contentUrl,
            position: module.position,
          },
        };
      }),
    };
  }

  async completeModule(
    courseId: string,
    moduleId: string,
    currentUser: AuthenticatedUser,
  ) {
    const enrollment = await this.prismaService.enrollment.findFirst({
      where: {
        courseId,
        userId: currentUser.userId,
      },
      include: {
        course: {
          include: { modules: true },
        },
      },
    });

    if (!enrollment) {
      throw new NotFoundException('No existe inscripcion para este curso');
    }

    const targetModule = enrollment.course.modules.find(
      (module) => module.id === moduleId,
    );

    if (!targetModule) {
      throw new NotFoundException('Modulo no encontrado dentro del curso');
    }

    await this.prismaService.progress.upsert({
      where: {
        enrollmentId_courseModuleId: {
          enrollmentId: enrollment.id,
          courseModuleId: moduleId,
        },
      },
      update: {
        completed: true,
        completedAt: new Date(),
      },
      create: {
        enrollmentId: enrollment.id,
        courseModuleId: moduleId,
        completed: true,
        completedAt: new Date(),
      },
    });

    return this.getMyCourseProgress(courseId, currentUser);
  }

  private normalizeModules(
    modules: CreateCourseModuleDto[] | UpdateCourseModuleDto[],
  ) {
    return modules.map((module, index) => ({
      title: module.title,
      description: module.description,
      type: module.type,
      contentUrl: module.contentUrl,
      position: module.position ?? index + 1,
    }));
  }

  private async generateUniqueSlug(source: string, excludeCourseId?: string) {
    const baseSlug = this.slugify(source);

    if (!baseSlug) {
      throw new BadRequestException('No se pudo generar un slug valido');
    }

    let slug = baseSlug;
    let suffix = 1;

    while (true) {
      const existing = await this.prismaService.course.findUnique({
        where: { slug },
      });

      if (!existing || existing.id === excludeCourseId) {
        return slug;
      }

      suffix += 1;
      slug = `${baseSlug}-${suffix}`;
    }
  }

  private slugify(value: string) {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  private serializeCourse(course: CourseWithRelations) {
    return {
      id: course.id,
      title: course.title,
      slug: course.slug,
      description: course.description,
      price: Number(course.price.toString()),
      isPublished: course.isPublished,
      createdBy: {
        id: course.createdBy.id,
        fullName: course.createdBy.fullName,
        email: course.createdBy.email,
      },
      enrollmentCount: course.enrollments.length,
      modules: course.modules.map((module) => ({
        id: module.id,
        title: module.title,
        description: module.description,
        type: module.type,
        contentUrl: module.contentUrl,
        position: module.position,
      })),
      createdAt: course.createdAt,
      updatedAt: course.updatedAt,
    };
  }

  private handlePrismaError(error: unknown) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new ConflictException(
        'Ya existe un registro que entra en conflicto con otro curso o inscripcion',
      );
    }

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2025'
    ) {
      throw new NotFoundException('No se encontro el recurso solicitado');
    }
  }
}
