import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { TranslationInterceptor } from './common/interceptors/translation.interceptor';
import { I18nService } from 'nestjs-i18n';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as morgan from 'morgan';
import * as fs from 'fs';
import * as path from 'path';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS globally with explicit configuration
  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      
      // Allow specific origins: localhost and production shop domain
      const allowedOrigins = [
        'http://localhost:3000',
        'http://localhost:3001',
        'https://shop.medicova.net',
        'http://shop.medicova.net', // Also allow http version
        'https://www.medicova.cloud',
        'https://medicova.cloud',
        'https://medicova.cloud/'

      ];
      
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      
      // Allow all other origins
      return callback(null, true);
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-user-id', 'x-lang', 'accept-language', 'X-Requested-With'],
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });

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

  // Swagger Documentation
  const config = new DocumentBuilder()
    .setTitle('Medicova API')
    .setDescription('Medicova E-commerce API Documentation')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('Auth', 'Authentication endpoints')
    .addTag('Users', 'User management endpoints')
    .addTag('Categories', 'Category management endpoints')
    .addTag('Subcategories', 'Subcategory management endpoints')
    .addTag('Subcategory Child', 'Subcategory child management endpoints')
    .addTag('Brands', 'Brand management endpoints')
    .addTag('Products', 'Product management endpoints')
    .addTag('Orders', 'Order management endpoints')
    .addTag('Cart', 'Shopping cart endpoints')
    .addTag('Coupons', 'Coupon/Discount management endpoints')
    .addTag('Tags', 'Tag management endpoints')
    .addTag('Reviews', 'Review management endpoints')
    .addServer('http://localhost:3000', 'Development server')
    .addServer('http://82.112.255.49', 'Production server')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  await app.listen(3000);
  console.log(`Server running on http://localhost:3000/api/v1`);
  console.log(`Swagger docs available at http://localhost:3000/api/docs`);
}
bootstrap();
