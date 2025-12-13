import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SellerBrandsController } from './seller-brands.controller';
import { SellerBrandsService } from './seller-brands.service';
import { SellerBrand, SellerBrandSchema } from './entities/seller-brand.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SellerBrand.name, schema: SellerBrandSchema },
    ]),
  ],
  controllers: [SellerBrandsController],
  providers: [SellerBrandsService],
  exports: [SellerBrandsService],
})
export class SellerBrandsModule {}









