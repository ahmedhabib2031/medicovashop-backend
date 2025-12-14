import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SellerStoreController } from './seller-store.controller';
import { SellerStoreService } from './seller-store.service';
import { SellerStore, SellerStoreSchema } from './entities/seller-store.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SellerStore.name, schema: SellerStoreSchema },
    ]),
  ],
  controllers: [SellerStoreController],
  providers: [SellerStoreService],
  exports: [SellerStoreService],
})
export class SellerStoreModule {}













