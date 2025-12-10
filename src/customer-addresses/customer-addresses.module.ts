import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CustomerAddressesController } from './customer-addresses.controller';
import { CustomerAddressesService } from './customer-addresses.service';
import {
  CustomerAddress,
  CustomerAddressSchema,
} from './entities/customer-address.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CustomerAddress.name, schema: CustomerAddressSchema },
    ]),
  ],
  controllers: [CustomerAddressesController],
  providers: [CustomerAddressesService],
  exports: [CustomerAddressesService],
})
export class CustomerAddressesModule {}




