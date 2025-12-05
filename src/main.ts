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
        origin: (origin, callback) => {
          // Allow requests with no origin (like mobile apps or curl requests)
          if (!origin) return callback(null, true);
          
          // Allow specific origins: localhost and production shop domain
          const allowedOrigins = [
            'http://localhost:3000',
            'http://localhost:3001',
            'https://shop.medicova.net',
          ];
          
          if (allowedOrigins.includes(origin)) {
            return callback(null, true);
          }
          
          // Allow all other origins
          return callback(null, true);
        },
        methods: 'GET,POST,PATCH,DELETE,PUT,OPTIONS',
        allowedHeaders: 'Content-Type, Authorization, x-user-id, x-lang, accept-language',
        credentials: true,
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
