import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { TranslationInterceptor } from './common/interceptors/translation.interceptor';
import { I18nService } from 'nestjs-i18n';
import * as morgan from 'morgan';
import * as fs from 'fs';
import * as path from 'path';

async function bootstrap() {
  const app = await NestFactory.create(AppModule,
    {
      cors: {
        origin: '*', // Or use a specific origin: ['https://your-frontend.com']
        methods: 'GET,POST,PATCH,DELETE,PUT',
        allowedHeaders: 'Content-Type, Authorization',
      },
    }
  );

  app.setGlobalPrefix('api/v1');

  // Create logs directory if not exists
  const logDirectory = path.join(process.cwd(), 'logs');
  if (!fs.existsSync(logDirectory)) {
    fs.mkdirSync(logDirectory);
  }

  // Create a write stream for access.log (append mode)
  const accessLogStream = fs.createWriteStream(
    path.join(logDirectory, 'access.log'),
    { flags: 'a' },
  );

  // Morgan logger
  app.use(morgan('combined', { stream: accessLogStream })); // writes logs to access.log
  app.use(morgan('dev')); // optional: still log to console

  // Validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Translation interceptor
  const i18nService =
    app.get<I18nService<Record<string, unknown>>>(I18nService);
  app.useGlobalInterceptors(new TranslationInterceptor(i18nService));

  // Global response wrapper
  app.useGlobalInterceptors(new ResponseInterceptor());

  await app.listen(3000);
  console.log(`Server running on http://localhost:3000/api/v1`);
}
bootstrap();
