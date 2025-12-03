import {
  Controller,
  Post,
  UploadedFiles,
  UseInterceptors,
  Body,
  Req,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { UploadService } from './upload.service';
import { I18nService } from 'nestjs-i18n';

@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService,
        private readonly i18n: I18nService,
    
  ) {}

  private getLang(req: any): string {
    return (
      req.headers['accept-language']?.split(',')[0] ||
      req.user?.language ||
      'en'
    );
  }

  @Post('images')
  @UseInterceptors(FilesInterceptor('images', 10))
  async uploadImages(
    @UploadedFiles() files: Express.S3File[],
    @Body('category') category: string,
    @Req() req,
  ) {
    const urls = this.uploadService.saveFileUrls(files);
    const lang = this.getLang(req);

    return {
      data: {
        category,
        images: urls,
      },
      message: await this.i18n.t('users.IMAGE_UPLOADED', { lang }),
    };
  }
}
