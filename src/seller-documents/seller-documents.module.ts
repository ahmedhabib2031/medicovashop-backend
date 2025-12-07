import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SellerDocumentsController } from './seller-documents.controller';
import { SellerDocumentsService } from './seller-documents.service';
import {
  SellerDocument,
  SellerDocumentSchema,
} from './entities/seller-document.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SellerDocument.name, schema: SellerDocumentSchema },
    ]),
  ],
  controllers: [SellerDocumentsController],
  providers: [SellerDocumentsService],
  exports: [SellerDocumentsService],
})
export class SellerDocumentsModule {}

