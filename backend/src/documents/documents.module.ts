import { Module } from '@nestjs/common';
import { DocumentsStorageService } from './documents-storage.service';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';

@Module({
  controllers: [DocumentsController],
  providers: [DocumentsService, DocumentsStorageService],
})
export class DocumentsModule {}
