declare namespace Express {
  export interface S3File extends Multer.File {
    location: string;
    key: string;
    bucket: string;
  }
}
