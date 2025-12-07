import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { DocumentStatus } from '../entities/seller-document.entity';

export class UpdateDocumentStatusDto {
  @ApiProperty({
    example: 'approved',
    enum: DocumentStatus,
    description: 'Document status (approved or rejected)',
  })
  @IsEnum(DocumentStatus, {
    message: 'Status must be either approved or rejected',
  })
  status: DocumentStatus;

  @ApiProperty({
    example: 'Document is not clear',
    description: 'Rejection reason (required if status is rejected)',
    required: false,
  })
  @IsOptional()
  @IsString()
  rejectionReason?: string;
}

