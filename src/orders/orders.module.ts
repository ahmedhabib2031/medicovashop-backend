import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { Order, OrderSchema } from './entities/order.entity';
import { Product, ProductSchema } from '../products/entities/product.entity';
import { CustomerAddress, CustomerAddressSchema } from '../customer-addresses/entities/customer-address.entity';
import { Discount, DiscountSchema } from '../coupons/entities/coupon.entity';
import { ProductInventory, ProductInventorySchema } from '../inventory/entities/product-inventory.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Order.name, schema: OrderSchema },
      { name: Product.name, schema: ProductSchema },
      { name: CustomerAddress.name, schema: CustomerAddressSchema },
      { name: Discount.name, schema: DiscountSchema },
      { name: ProductInventory.name, schema: ProductInventorySchema },
    ]),
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
