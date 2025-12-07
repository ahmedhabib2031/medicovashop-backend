import { PartialType } from '@nestjs/mapped-types';
import { CreateProductAttributeDto } from './create-attribute.dto';

export class UpdateProductAttributeDto extends PartialType(CreateProductAttributeDto) {}
