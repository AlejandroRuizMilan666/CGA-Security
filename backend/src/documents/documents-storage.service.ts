import {
  CreateBucketCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';

type UploadedBinaryFile = {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
};

@Injectable()
export class DocumentsStorageService implements OnModuleInit {
  private readonly logger = new Logger(DocumentsStorageService.name);
  private readonly bucket: string;
  private readonly client: S3Client;

  constructor(private readonly configService: ConfigService) {
    const forcePathStyle =
      this.configService.get<string>('S3_FORCE_PATH_STYLE') !== 'false';

    this.bucket =
      this.configService.get<string>('S3_BUCKET') ?? 'cga-security-documents';

    this.client = new S3Client({
      region: this.configService.get<string>('S3_REGION') ?? 'us-east-1',
      endpoint:
        this.configService.get<string>('S3_ENDPOINT') ??
        'http://localhost:9000',
      forcePathStyle,
      credentials: {
        accessKeyId:
          this.configService.get<string>('S3_ACCESS_KEY') ?? 'minioadmin',
        secretAccessKey:
          this.configService.get<string>('S3_SECRET_KEY') ?? 'minioadmin',
      },
    });
  }

  async onModuleInit() {
    await this.ensureBucket();
  }

  async uploadObject(file: UploadedBinaryFile, companyId: string) {
    const sanitizedName = this.sanitizeFileName(file.originalname);
    const storageName = `companies/${companyId}/${randomUUID()}-${sanitizedName}`;

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: storageName,
        Body: file.buffer,
        ContentType: file.mimetype,
      }),
    );

    return {
      storageName,
      bucket: this.bucket,
    };
  }

  async getSignedDownloadUrl(storageName: string, originalName: string) {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: storageName,
      ResponseContentDisposition: `attachment; filename="${this.sanitizeFileName(originalName)}"`,
    });

    return getSignedUrl(this.client, command, { expiresIn: 300 });
  }

  async deleteObject(storageName: string) {
    await this.client.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: storageName,
      }),
    );
  }

  private async ensureBucket() {
    try {
      await this.client.send(
        new HeadBucketCommand({
          Bucket: this.bucket,
        }),
      );
    } catch {
      try {
        await this.client.send(
          new CreateBucketCommand({
            Bucket: this.bucket,
          }),
        );
      } catch (error) {
        this.logger.warn(
          `No se pudo crear automaticamente el bucket ${this.bucket}: ${String(error)}`,
        );
      }
    }
  }

  private sanitizeFileName(fileName: string) {
    return fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  }
}
