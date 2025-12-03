import { Injectable } from '@nestjs/common';

@Injectable()
export class UploadService {
  saveFileUrls(files: Express.S3File[]) {
    return files.map((file) => file.location);
  }
}
