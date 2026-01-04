import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProductCollectionController } from './product-collection.controller';
import { ProductCollectionService } from './product-collection.service';
import {
  ProductCollection,
  ProductCollectionSchema,
} from './entities/product-collection.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ProductCollection.name, schema: ProductCollectionSchema },
    ]),
  ],
  controllers: [ProductCollectionController],
  providers: [ProductCollectionService],
  exports: [ProductCollectionService],
})
export class ProductCollectionModule {}


















