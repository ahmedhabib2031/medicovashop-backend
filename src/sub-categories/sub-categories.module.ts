import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SubCategoryService } from './sub-categories.service';
import { SubCategoryController } from './sub-categories.controller';
import { SubCategory, SubCategorySchema } from './entities/subcategory.entity';
import { SubcategoryChild, SubcategoryChildSchema } from '../subcategory-child/entities/subcategory-child.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SubCategory.name, schema: SubCategorySchema },
      { name: SubcategoryChild.name, schema: SubcategoryChildSchema },
    ]),
  ],
  controllers: [SubCategoryController],
  providers: [SubCategoryService],
  exports: [SubCategoryService],
})
export class SubCategoryModule {}
