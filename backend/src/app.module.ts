import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { BootstrapService } from './bootstrap/bootstrap.service';
import { CompaniesModule } from './companies/companies.module';
import { validateEnvironment } from './config/env.validation';
import { CoursesModule } from './courses/courses.module';
import { DocumentsModule } from './documents/documents.module';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnvironment,
    }),
    // ── Rate limiting (OWASP A07) ──────────────────────────────────────
    // 'api' throttle: general limit applied to all routes via APP_GUARD.
    // Auth-specific routes override this with stricter limits via @Throttle.
    ThrottlerModule.forRoot([
      {
        name: 'api',
        ttl: 60_000,
        limit: 60, // 60 req / min per IP for general API endpoints
      },
    ]),
    PrismaModule,
    AuthModule,
    UsersModule,
    CompaniesModule,
    CoursesModule,
    DocumentsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    BootstrapService,
    // Apply ThrottlerGuard globally to every route (OWASP A07)
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
