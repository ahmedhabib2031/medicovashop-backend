import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { MulterS3Config } from './multer-s3.config';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';

@Module({
  imports: [
    MulterModule.registerAsync({
      useClass: MulterS3Config,
    }),
  ],
  controllers: [UploadController],
  providers: [UploadService],
})
export class UploadModule {}
