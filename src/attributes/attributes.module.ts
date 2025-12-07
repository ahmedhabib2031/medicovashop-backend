import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AttributesService } from './attributes.service';
import { AttributesController } from './attributes.controller';
import { ProductAttribute, ProductAttributeSchema } from './entities/attribute.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ProductAttribute.name, schema: ProductAttributeSchema },
    ]),
  ],
  controllers: [AttributesController],
  providers: [AttributesService],
  exports: [AttributesService],
})
export class AttributesModule {}
