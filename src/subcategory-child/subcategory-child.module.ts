import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SubcategoryChildController } from './subcategory-child.controller';
import { SubcategoryChildService } from './subcategory-child.service';
import { SubcategoryChild, SubcategoryChildSchema } from './entities/subcategory-child.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SubcategoryChild.name, schema: SubcategoryChildSchema },
    ]),
  ],
  controllers: [SubcategoryChildController],
  providers: [SubcategoryChildService],
  exports: [SubcategoryChildService],
})
export class SubcategoryChildModule {}


