import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, RoleName } from '@prisma/client';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { PrismaService } from '../prisma/prisma.service';
import { DocumentsStorageService } from './documents-storage.service';
import { UploadDocumentDto } from './dto/upload-document.dto';

type UploadedBinaryFile = {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
};

@Injectable()
export class DocumentsService {
  private readonly maxFileSizeBytes = 10 * 1024 * 1024;
  private readonly allowedMimeTypes = new Set([
    'application/pdf',
    'image/png',
    'image/jpeg',
    'text/plain',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ]);

  constructor(
    private readonly prismaService: PrismaService,
    private readonly documentsStorageService: DocumentsStorageService,
  ) {}

  async listOwnDocuments(currentUser: AuthenticatedUser) {
    const companyId = await this.resolveTargetCompanyId(currentUser);

    const documents = await this.prismaService.document.findMany({
      where: { companyId },
      include: {
        company: true,
        uploadedBy: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return documents.map((document) => this.serializeDocument(document));
  }

  async listCompanyDocuments(companyId: string) {
    const documents = await this.prismaService.document.findMany({
      where: { companyId },
      include: {
        company: true,
        uploadedBy: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return documents.map((document) => this.serializeDocument(document));
  }

  async uploadDocument(
    currentUser: AuthenticatedUser,
    dto: UploadDocumentDto,
    file?: UploadedBinaryFile,
  ) {
    if (!file) {
      throw new BadRequestException('Debes adjuntar un archivo');
    }

    this.validateFile(file);

    // Multer delivers originalname encoded as Latin-1; decode to UTF-8 so
    // accented characters (tildes, ñ, etc.) are stored correctly.
    const originalName = Buffer.from(file.originalname, 'latin1').toString(
      'utf8',
    );

    const companyId = await this.resolveTargetCompanyId(
      currentUser,
      dto.companyId,
    );
    const storageResult = await this.documentsStorageService.uploadObject(
      { ...file, originalname: originalName },
      companyId,
    );

    try {
      const document = await this.prismaService.document.create({
        data: {
          companyId,
          uploadedById: currentUser.userId,
          originalName,
          storageName: storageResult.storageName,
          mimeType: file.mimetype,
          sizeBytes: BigInt(file.size),
          direction: dto.direction,
          notes: dto.notes,
        },
        include: {
          company: true,
          uploadedBy: true,
        },
      });

      return this.serializeDocument(document);
    } catch (error) {
      this.handlePrismaError(error);
      throw error;
    }
  }

  async getDownloadLink(documentId: string, currentUser: AuthenticatedUser) {
    const document = await this.prismaService.document.findUnique({
      where: { id: documentId },
      include: {
        company: true,
        uploadedBy: true,
      },
    });

    if (!document) {
      throw new NotFoundException('Documento no encontrado');
    }

    await this.assertDocumentAccess(document.companyId, currentUser);

    const signedUrl = await this.documentsStorageService.getSignedDownloadUrl(
      document.storageName,
      document.originalName,
    );

    return {
      ...this.serializeDocument(document),
      url: signedUrl,
      expiresInSeconds: 300,
    };
  }

  async deleteDocument(documentId: string, currentUser: AuthenticatedUser) {
    const document = await this.prismaService.document.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      throw new NotFoundException('Documento no encontrado');
    }

    await this.assertDocumentAccess(document.companyId, currentUser);
    await this.documentsStorageService.deleteObject(document.storageName);
    await this.prismaService.document.delete({ where: { id: documentId } });

    return { message: 'Documento eliminado correctamente' };
  }

  private validateFile(file: UploadedBinaryFile) {
    if (file.size > this.maxFileSizeBytes) {
      throw new BadRequestException(
        'El archivo supera el limite permitido de 10 MB',
      );
    }

    if (!this.allowedMimeTypes.has(file.mimetype)) {
      throw new BadRequestException(
        'El tipo de archivo no esta permitido en esta beta',
      );
    }
  }

  private async resolveTargetCompanyId(
    currentUser: AuthenticatedUser,
    requestedCompanyId?: string,
  ) {
    if (currentUser.role === RoleName.ADMIN) {
      if (!requestedCompanyId) {
        throw new BadRequestException('Debes indicar la empresa de destino');
      }

      const company = await this.prismaService.company.findUnique({
        where: { id: requestedCompanyId },
      });

      if (!company) {
        throw new NotFoundException('Empresa no encontrada');
      }

      return company.id;
    }

    const company = await this.prismaService.company.findUnique({
      where: { userId: currentUser.userId },
    });

    if (!company) {
      throw new NotFoundException('No existe una empresa asociada al usuario');
    }

    return company.id;
  }

  private async assertDocumentAccess(
    companyId: string,
    currentUser: AuthenticatedUser,
  ) {
    if (currentUser.role === RoleName.ADMIN) {
      return;
    }

    const company = await this.prismaService.company.findUnique({
      where: { userId: currentUser.userId },
    });

    if (!company || company.id !== companyId) {
      throw new NotFoundException('No tienes acceso a este documento');
    }
  }

  private serializeDocument(
    document: Prisma.DocumentGetPayload<{
      include: {
        company: true;
        uploadedBy: true;
      };
    }>,
  ) {
    return {
      id: document.id,
      companyId: document.companyId,
      companyName: document.company.companyName,
      uploadedBy: document.uploadedBy
        ? {
            id: document.uploadedBy.id,
            fullName: document.uploadedBy.fullName,
            email: document.uploadedBy.email,
          }
        : null,
      originalName: document.originalName,
      mimeType: document.mimeType,
      sizeBytes: Number(document.sizeBytes),
      direction: document.direction,
      notes: document.notes,
      createdAt: document.createdAt,
      updatedAt: document.updatedAt,
    };
  }

  private handlePrismaError(error: unknown) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new ConflictException('Ya existe un documento con esos datos');
    }
  }
}
