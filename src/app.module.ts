import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { ShippingModule } from './shipping/shipping.module';
import { CouponsModule } from './coupons/coupons.module';
import { NotificationsModule } from './notifications/notifications.module';
import { FaqModule } from './faq/faq.module';
import { ReviewsModule } from './reviews/reviews.module';
import { PaymentsModule } from './payments/payments.module';
import { AuthModule } from './auth/auth.module';
import { CartModule } from './cart/cart.module';
import { OrdersModule } from './orders/orders.module';
import { CategoriesModule } from './categories/categories.module';
import { ProductsModule } from './products/products.module';
import { AdminModule } from './admin/admin.module';
import { SellersModule } from './sellers/sellers.module';
import { TagsModule } from './tags/tags.module';
import { AttributesModule } from './attributes/attributes.module';
import { OptionsModule } from './options/options.module';
import { SubCategoriesModule } from './sub-categories/sub-categories.module';
import { DiscountModule } from './discount/discount.module';
import { BrandsModule } from './brands/brands.module';
import { TestimonialsModule } from './testimonials/testimonials.module';
import { ConfigModule } from '@nestjs/config';
import {
  I18nModule,
  AcceptLanguageResolver,
  QueryResolver,
  HeaderResolver,
} from 'nestjs-i18n';
import * as path from 'path';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(
      process.env.MONGO_URI || 'mongodb://localhost:27017/medicova',
    ),
    I18nModule.forRoot({
      fallbackLanguage: 'en',
      loaderOptions: {
        path: path.join(process.cwd(), 'src/i18n'),
        watch: true,
      },
      resolvers: [
        { use: QueryResolver, options: ['lang'] },
        AcceptLanguageResolver,
        new HeaderResolver(['x-lang']),
      ],
    }),
    SellersModule,
    AdminModule,
    ProductsModule,
    CategoriesModule,
    OrdersModule,
    AuthModule,
    CartModule,
    PaymentsModule,
    ReviewsModule,
    FaqModule,
    NotificationsModule,
    CouponsModule,
    ShippingModule,
    UsersModule,
    TagsModule,
    AttributesModule,
    OptionsModule,
    SubCategoriesModule,
    DiscountModule,
    BrandsModule,
    TestimonialsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
