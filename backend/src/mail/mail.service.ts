import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer, { Transporter } from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter?: Transporter;

  constructor(private readonly configService: ConfigService) {}

  async sendPasswordResetEmail(options: {
    email: string;
    fullName: string;
    resetUrl: string;
  }): Promise<void> {
    const transporter = this.getTransporter();

    await transporter.sendMail({
      from: this.configService.get<string>('SMTP_FROM'),
      to: options.email,
      subject: 'Recuperacion de contraseña',
      text: `Hola ${options.fullName},\n\nHemos recibido una solicitud para restablecer tu contraseña. Usa este enlace: ${options.resetUrl}\n\nSi no has solicitado este cambio, ignora este mensaje.`,
      html: `<p>Hola ${options.fullName},</p><p>Hemos recibido una solicitud para restablecer tu contraseña.</p><p><a href="${options.resetUrl}">Restablecer contraseña</a></p><p>Si no has solicitado este cambio, ignora este mensaje.</p>`,
    });

    this.logger.log(`Correo de recuperacion enviado a ${options.email}`);
  }

  private getTransporter(): Transporter {
    if (!this.transporter) {
      const port = this.configService.get<number>('SMTP_PORT') ?? 1025;
      const secure =
        (
          this.configService.get<string>('SMTP_SECURE') ?? 'false'
        ).toLowerCase() === 'true';
      const user = this.configService.get<string>('SMTP_USER') ?? '';
      const pass = this.configService.get<string>('SMTP_PASS') ?? '';

      this.transporter = nodemailer.createTransport({
        host: this.configService.get<string>('SMTP_HOST'),
        port,
        secure,
        auth: user ? { user, pass } : undefined,
      });
    }

    return this.transporter;
  }
}
