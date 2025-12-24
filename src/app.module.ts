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
import { CategoryModule } from './categories/categories.module';
import { ProductsModule } from './products/products.module';
import { AdminModule } from './admin/admin.module';
import { SellersModule } from './sellers/sellers.module';
import { TagsModule } from './tags/tags.module';
import { AttributesModule } from './attributes/attributes.module';
import { OptionsModule } from './options/options.module';
import { SubCategoryModule } from './sub-categories/sub-categories.module';
import { BrandModule } from './brands/brands.module';
import { TestimonialsModule } from './testimonials/testimonials.module';
import { SubcategoryChildModule } from './subcategory-child/subcategory-child.module';
import { SellerStoreModule } from './seller-store/seller-store.module';
import { SellerDocumentsModule } from './seller-documents/seller-documents.module';
import { CustomerAddressesModule } from './customer-addresses/customer-addresses.module';
import { SellerBrandsModule } from './seller-brands/seller-brands.module';
import { SellerWishlistsModule } from './seller-wishlists/seller-wishlists.module';
import { InventoryModule } from './inventory/inventory.module';
import { ProductCollectionModule } from './product-collection/product-collection.module';
import { ConfigModule } from '@nestjs/config';
import { UploadModule } from './upload/upload.module';

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
    CategoryModule,
    OrdersModule,
    AuthModule,
    CartModule,
    PaymentsModule,
    ReviewsModule,
    UploadModule,
    FaqModule,
    NotificationsModule,
    CouponsModule,
    ShippingModule,
    UsersModule,
    TagsModule,
    AttributesModule,
    OptionsModule,
    SubCategoryModule,
    SubcategoryChildModule,
    BrandModule,
    TestimonialsModule,
    SellerStoreModule,
    SellerDocumentsModule,
    CustomerAddressesModule,
    SellerBrandsModule,
    SellerWishlistsModule,
    InventoryModule,
    ProductCollectionModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
