import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Discount, DiscountDocument } from './entities/coupon.entity';
import { CreateDiscountDto, DiscountMethod } from './dto/create-coupon.dto';
import { UpdateDiscountDto } from './dto/update-coupon.dto';

@Injectable()
export class DiscountsService {
  constructor(
    @InjectModel(Discount.name) private discountModel: Model<DiscountDocument>,
  ) {}

  /**
   * Generate a random discount code
   */
  generateRandomCode(length: number = 8): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Generate a unique discount code
   */
  async generateUniqueCode(): Promise<string> {
    let code: string;
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 10;

    while (!isUnique && attempts < maxAttempts) {
      code = this.generateRandomCode(8);
      const existing = await this.discountModel.findOne({ discountCode: code });
      if (!existing) {
        isUnique = true;
      }
      attempts++;
    }

    if (!isUnique) {
      throw new BadRequestException('Failed to generate unique discount code');
    }

    return code;
  }

  async create(dto: CreateDiscountDto): Promise<Discount> {
    // Set default method if not provided
    const method = dto.method || DiscountMethod.AUTOMATIC_DISCOUNT;

    // If method is discount_code and code is not provided, generate one
    if (method === DiscountMethod.DISCOUNT_CODE && !dto.discountCode) {
      dto.discountCode = await this.generateUniqueCode();
    }

    // If method is discount_code, ensure code is unique
    if (method === DiscountMethod.DISCOUNT_CODE && dto.discountCode) {
      const existing = await this.discountModel.findOne({
        discountCode: dto.discountCode,
      });
      if (existing) {
        throw new BadRequestException('Discount code already exists');
      }
    }

    // Validate discount value based on type
    if (dto.discountType === 'percentage' && dto.discountValue > 100) {
      throw new BadRequestException('Percentage discount cannot exceed 100%');
    }

    // Prepare discount data
    const discountData: any = {
      ...dto,
      method,
      discountType: dto.discountType,
      discountValue: dto.discountValue,
      appliesTo: dto.appliesTo || 'all_products',
      eligibility: dto.eligibility || 'all_customers',
      availableOnAllSalesChannels: dto.availableOnAllSalesChannels ?? true,
      active: dto.active ?? true,
    };

    // Only include discountCode if method is discount_code
    if (method === DiscountMethod.DISCOUNT_CODE) {
      discountData.discountCode = dto.discountCode;
    } else {
      discountData.discountCode = undefined;
    }

    // Handle appliesTo arrays
    if (dto.appliesTo === 'specific_products' && dto.productIds) {
      discountData.productIds = dto.productIds;
    }
    if (dto.appliesTo === 'specific_categories' && dto.categoryIds) {
      discountData.categoryIds = dto.categoryIds;
    }
    if (dto.appliesTo === 'specific_subcategories' && dto.subcategoryIds) {
      discountData.subcategoryIds = dto.subcategoryIds;
    }

    // Handle eligibility arrays
    if (dto.eligibility === 'specific_customer_segments' && dto.customerSegmentIds) {
      discountData.customerSegmentIds = dto.customerSegmentIds;
    }
    if (dto.eligibility === 'specific_customers' && dto.customerIds) {
      discountData.customerIds = dto.customerIds;
    }

    // Convert dates
    if (dto.startDate) {
      discountData.startDate = new Date(dto.startDate);
    }
    if (dto.endDate) {
      discountData.endDate = new Date(dto.endDate);
    }

    const discount = new this.discountModel(discountData);
    return discount.save();
  }

  async findAll(query?: {
    page?: number;
    limit?: number;
    search?: string;
    method?: DiscountMethod;
    active?: boolean;
    sellerId?: string;
  }): Promise<{ data: Discount[]; total: number }> {
    const page = query?.page > 0 ? query.page : 1;
    const limit = query?.limit > 0 ? query.limit : 10;
    const skip = (page - 1) * limit;

    const filter: any = {};

    // If sellerId is provided, filter by it
    if (query?.sellerId) {
      filter.sellerId = query.sellerId;
    }

    if (query?.search) {
      filter.$or = [
        { discountName: { $regex: query.search, $options: 'i' } },
        { discountCode: { $regex: query.search, $options: 'i' } },
      ];
    }

    if (query?.method) {
      filter.method = query.method;
    }

    if (query?.active !== undefined) {
      filter.active = query.active;
    }

    const total = await this.discountModel.countDocuments(filter);

    const discounts = await this.discountModel
      .find(filter)
      .populate('sellerId', 'firstName lastName brandName email')
      .populate('productIds', 'productName productNameAr price')
      .populate('customerIds', 'firstName lastName email')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .exec();

    return { data: discounts, total };
  }

  async findOne(id: string): Promise<Discount> {
    const discount = await this.discountModel
      .findById(id)
      .populate('sellerId', 'firstName lastName brandName email')
      .populate('productIds', 'productName productNameAr price')
      .populate('customerIds', 'firstName lastName email')
      .exec();
    if (!discount) throw new NotFoundException('Discount not found');
    return discount;
  }

  async findByCode(code: string): Promise<Discount> {
    const discount = await this.discountModel
      .findOne({ discountCode: code, active: true })
      .populate('sellerId', 'firstName lastName brandName email')
      .populate('productIds', 'productName productNameAr price')
      .populate('customerIds', 'firstName lastName email')
      .exec();
    if (!discount) throw new NotFoundException('Discount code not found or inactive');
    return discount;
  }

  async update(id: string, dto: UpdateDiscountDto, sellerId?: string): Promise<Discount> {
    const existing = await this.discountModel.findById(id);
    if (!existing) throw new NotFoundException('Discount not found');

    // If seller is updating, ensure they own this discount
    if (sellerId && existing.sellerId && existing.sellerId.toString() !== sellerId) {
      throw new BadRequestException('You can only update your own discounts');
    }

    // If updating discount code, check uniqueness
    if (dto.discountCode && dto.discountCode !== existing.discountCode) {
      const codeExists = await this.discountModel.findOne({
        discountCode: dto.discountCode,
        _id: { $ne: id },
      });
      if (codeExists) {
        throw new BadRequestException('Discount code already exists');
      }
    }

    // Validate discount value
    const discountValue = dto.discountValue ?? existing.discountValue;
    const discountType = dto.discountType ?? existing.discountType;
    if (discountType === 'percentage' && discountValue > 100) {
      throw new BadRequestException('Percentage discount cannot exceed 100%');
    }

    // Prepare update data
    const updateData: any = { ...dto };

    // Convert dates if provided
    if (dto.startDate) {
      updateData.startDate = new Date(dto.startDate);
    }
    if (dto.endDate !== undefined) {
      updateData.endDate = dto.endDate ? new Date(dto.endDate) : null;
    }

    const discount = await this.discountModel.findByIdAndUpdate(id, updateData, {
      new: true,
    })
      .populate('sellerId', 'firstName lastName brandName email')
      .populate('productIds', 'productName productNameAr price')
      .populate('customerIds', 'firstName lastName email')
      .exec();

    return discount;
  }

  async remove(id: string, sellerId?: string): Promise<{ message: string }> {
    const discount = await this.discountModel.findById(id);
    if (!discount) throw new NotFoundException('Discount not found');

    // If seller is deleting, ensure they own this discount
    if (sellerId && discount.sellerId && discount.sellerId.toString() !== sellerId) {
      throw new BadRequestException('You can only delete your own discounts');
    }

    await this.discountModel.findByIdAndDelete(id);
    return { message: 'Discount deleted successfully' };
  }
}
