import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SellerWishlistsController } from './seller-wishlists.controller';
import { SellerWishlistsService } from './seller-wishlists.service';
import {
  SellerWishlist,
  SellerWishlistSchema,
} from './entities/seller-wishlist.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SellerWishlist.name, schema: SellerWishlistSchema },
    ]),
  ],
  controllers: [SellerWishlistsController],
  providers: [SellerWishlistsService],
  exports: [SellerWishlistsService],
})
export class SellerWishlistsModule {}










