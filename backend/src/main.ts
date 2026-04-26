import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { json, urlencoded } from 'express';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  // Disable the default body parser so we can enforce size limits manually
  const app = await NestFactory.create(AppModule, { bodyParser: false });
  const configService = app.get(ConfigService);
  const frontendUrl =
    configService.get<string>('FRONTEND_URL') ?? 'http://localhost:3000';
  const port = configService.get<number>('PORT') ?? 3001;

  app.setGlobalPrefix('api/v1');

  // ── Body size limits ──────────────────────────────────────────────────
  // Prevents large-payload denial-of-service attacks (OWASP A05)
  app.use(json({ limit: '10kb' }));
  app.use(urlencoded({ extended: true, limit: '10kb' }));

  // ── HTTP security headers (Helmet) ───────────────────────────────────
  // Sets X-Content-Type-Options, X-Frame-Options, HSTS, etc. (OWASP A05)
  app.use(
    helmet({
      // CSP for REST API: disallow all framing and inline content
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'none'"],
          frameAncestors: ["'none'"],
        },
      },
      // Allow cross-origin resource sharing needed for API consumers
      crossOriginEmbedderPolicy: false,
    }),
  );

  // ── CORS ─────────────────────────────────────────────────────────────
  // Restricts cross-origin requests to the known frontend origin only.
  // The X-Requested-With header is whitelisted to allow the custom
  // CSRF-defense header sent by the Axios client (OWASP A01, A05).
  app.enableCors({
    origin: frontendUrl,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });

  // ── Global validation pipe ────────────────────────────────────────────
  // Strips unknown properties and validates all incoming DTOs (OWASP A03)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  await app.listen(port);
}
void bootstrap();
