import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { TranslationInterceptor } from './common/interceptors/translation.interceptor';
import { I18nService } from 'nestjs-i18n';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api/v1');

  // Validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Global response wrapper

  // Translation interceptor
  const i18nService =
    app.get<I18nService<Record<string, unknown>>>(I18nService);
  app.useGlobalInterceptors(new TranslationInterceptor(i18nService));
  app.useGlobalInterceptors(new ResponseInterceptor());
  await app.listen(3000);
  console.log(`Server running on http://localhost:3000/api/v1`);
}
bootstrap();
