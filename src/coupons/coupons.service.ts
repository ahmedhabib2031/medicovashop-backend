import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Discount, DiscountDocument } from './entities/coupon.entity';
import { CreateDiscountDto } from './dto/create-coupon.dto';
import { UpdateDiscountDto } from './dto/update-coupon.dto';

@Injectable()
export class DiscountsService {
  constructor(@InjectModel(Discount.name) private discountModel: Model<DiscountDocument>) {}

  async create(dto: CreateDiscountDto): Promise<Discount> {
    const discount = new this.discountModel(dto);
    return discount.save();
  }

  async findAll(): Promise<Discount[]> {
    return this.discountModel.find().exec();
  }

  async findOne(id: string): Promise<Discount> {
    const discount = await this.discountModel.findById(id).exec();
    if (!discount) throw new NotFoundException('Discount not found');
    return discount;
  }

  async update(id: string, dto: UpdateDiscountDto): Promise<Discount> {
    const discount = await this.discountModel.findByIdAndUpdate(id, dto, { new: true });
    if (!discount) throw new NotFoundException('Discount not found');
    return discount;
  }

  async remove(id: string): Promise<{ message: string }> {
    const result = await this.discountModel.findByIdAndDelete(id);
    if (!result) throw new NotFoundException('Discount not found');
    return { message: 'Discount deleted successfully' };
  }
}
