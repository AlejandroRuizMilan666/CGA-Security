import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { RoleName } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { DocumentsService } from './documents.service';
import { UploadDocumentDto } from './dto/upload-document.dto';

@Controller('documents')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Get('me')
  @Roles(RoleName.EMPRESA)
  listOwnDocuments(@CurrentUser() currentUser: AuthenticatedUser) {
    return this.documentsService.listOwnDocuments(currentUser);
  }

  @Get('company/:companyId')
  @Roles(RoleName.ADMIN)
  listCompanyDocuments(@Param('companyId', ParseUUIDPipe) companyId: string) {
    return this.documentsService.listCompanyDocuments(companyId);
  }

  @Post('upload')
  @Roles(RoleName.ADMIN, RoleName.EMPRESA)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 10 * 1024 * 1024,
      },
    }),
  )
  uploadDocument(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() dto: UploadDocumentDto,
    @UploadedFile()
    file?: {
      originalname: string;
      mimetype: string;
      size: number;
      buffer: Buffer;
    },
  ) {
    return this.documentsService.uploadDocument(currentUser, dto, file);
  }

  @Get(':documentId/download')
  @Roles(RoleName.ADMIN, RoleName.EMPRESA)
  getDownloadLink(
    @Param('documentId', ParseUUIDPipe) documentId: string,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.documentsService.getDownloadLink(documentId, currentUser);
  }

  @Delete(':documentId')
  @Roles(RoleName.ADMIN, RoleName.EMPRESA)
  deleteDocument(
    @Param('documentId', ParseUUIDPipe) documentId: string,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.documentsService.deleteDocument(documentId, currentUser);
  }
}
