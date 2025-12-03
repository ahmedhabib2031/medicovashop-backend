import { Injectable } from '@nestjs/common';
import { MulterOptionsFactory } from '@nestjs/platform-express';
import * as multerS3 from 'multer-s3';
import { s3Client } from './s3.config';
require("dotenv").config()
@Injectable()
export class MulterS3Config implements MulterOptionsFactory {
  createMulterOptions() {
    return {
      storage: multerS3({
        s3: s3Client,
        bucket: process.env.AWS_BUCKET_NAME,
        // acl: 'public-read',
        contentType: multerS3.AUTO_CONTENT_TYPE,

        key: (req, file, cb) => {
          const category = req.body.category || 'uncategorized';
          const filename = `${Date.now()}-${file.originalname}`;
          cb(null, `${category}/${filename}`);
        },
      }),
    };
  }
}
