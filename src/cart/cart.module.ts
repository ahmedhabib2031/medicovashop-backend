import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CartService } from './cart.service';
import { CartController } from './cart.controller';
import { Cart, CartSchema } from './entities/cart.entity';
import { Product, ProductSchema } from '../products/entities/product.entity';
import {
  ProductInventory,
  ProductInventorySchema,
} from '../inventory/entities/product-inventory.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Cart.name, schema: CartSchema },
      { name: Product.name, schema: ProductSchema },
      { name: ProductInventory.name, schema: ProductInventorySchema },
    ]),
  ],
  controllers: [CartController],
  providers: [CartService],
  exports: [CartService],
})
export class CartModule {}
