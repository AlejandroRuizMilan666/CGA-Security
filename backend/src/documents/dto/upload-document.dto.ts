import { DocumentDirection } from '@prisma/client';
import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class UploadDocumentDto {
  @IsEnum(DocumentDirection)
  direction!: DocumentDirection;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;

  @IsOptional()
  @IsUUID()
  companyId?: string;
}
