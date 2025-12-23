import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  SellerBrand,
  SellerBrandDocument,
  BrandStatus,
} from './entities/seller-brand.entity';
import { CreateSellerBrandDto } from './dto/create-seller-brand.dto';
import { UpdateSellerBrandDto } from './dto/update-seller-brand.dto';
import { UpdateBrandStatusDto } from './dto/update-brand-status.dto';

@Injectable()
export class SellerBrandsService {
  constructor(
    @InjectModel(SellerBrand.name)
    private sellerBrandModel: Model<SellerBrandDocument>,
  ) {}

  async create(dto: CreateSellerBrandDto): Promise<SellerBrand> {
    // Ensure sellerId is provided
    if (!dto.sellerId) {
      throw new BadRequestException('Seller ID is required');
    }

    // Check if seller already has a brand with the same name
    const existingBrand = await this.sellerBrandModel.findOne({
      sellerId: dto.sellerId,
      brandName: dto.brandName,
    });
    if (existingBrand) {
      throw new BadRequestException('BRAND_NAME_EXISTS');
    }

    return await this.sellerBrandModel.create(dto);
  }

  async findAll(query: {
    page?: number;
    limit?: number;
    search?: string;
    sellerId?: string;
    status?: BrandStatus;
  }): Promise<{ data: SellerBrand[]; total: number }> {
    const page = query.page > 0 ? query.page : 1;
    const limit = query.limit > 0 ? query.limit : 10;
    const skip = (page - 1) * limit;

    const filter: any = {};

    // If sellerId is provided, filter by it
    if (query.sellerId) {
      filter.sellerId = query.sellerId;
    }

    // Filter by status if provided
    if (query.status) {
      filter.status = query.status;
    }

    // Search filter
    if (query.search) {
      const regex = new RegExp(query.search, 'i');
      filter.$or = [
        { brandName: regex },
        { brandWebsiteLink: regex },
      ];
    }

    const total = await this.sellerBrandModel.countDocuments(filter);

    const brands = await this.sellerBrandModel
      .find(filter)
      .populate('sellerId', 'firstName lastName brandName email')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .lean();

    return { data: brands as SellerBrand[], total };
  }

  async findOne(id: string): Promise<SellerBrand> {
    const brand = await this.sellerBrandModel
      .findById(id)
      .populate('sellerId', 'firstName lastName brandName email')
      .lean();
    if (!brand) throw new NotFoundException('SELLER_BRAND_NOT_FOUND');
    return brand as SellerBrand;
  }

  async findBySellerId(sellerId: string): Promise<SellerBrand[]> {
    const brands = await this.sellerBrandModel
      .find({ sellerId })
      .populate('sellerId', 'firstName lastName brandName email')
      .sort({ createdAt: -1 })
      .lean();
    return brands as SellerBrand[];
  }

  async update(
    id: string,
    dto: UpdateSellerBrandDto,
    sellerId?: string,
  ): Promise<SellerBrand> {
    const brand = await this.sellerBrandModel.findById(id).lean();
    if (!brand) throw new NotFoundException('SELLER_BRAND_NOT_FOUND');

    // If seller is updating, ensure they own this brand
    if (sellerId && brand.sellerId.toString() !== sellerId) {
      throw new BadRequestException('You can only update your own brands');
    }

    // If brand name is being updated, check for duplicates
    if (dto.brandName && dto.brandName !== (brand as any).brandName) {
      const existingBrand = await this.sellerBrandModel.findOne({
        sellerId: brand.sellerId,
        brandName: dto.brandName,
        _id: { $ne: id },
      });
      if (existingBrand) {
        throw new BadRequestException('BRAND_NAME_EXISTS');
      }
    }

    // If status is not pending, don't allow updates (only pending brands can be updated)
    if ((brand as any).status !== BrandStatus.PENDING) {
      throw new BadRequestException('Only pending brands can be updated');
    }

    const updated = await this.sellerBrandModel
      .findByIdAndUpdate(id, dto, { new: true })
      .populate('sellerId', 'firstName lastName brandName email')
      .lean();
    return updated as SellerBrand;
  }

  async updateStatus(
    id: string,
    dto: UpdateBrandStatusDto,
  ): Promise<SellerBrand> {
    // If status is rejected, require rejection reason
    if (
      dto.status === BrandStatus.REJECTED &&
      (!dto.rejectionReason || dto.rejectionReason.trim() === '')
    ) {
      throw new BadRequestException('Rejection reason is required');
    }

    // If status is approved, clear rejection reason
    const updateData: any = {
      status: dto.status,
    };

    if (dto.status === BrandStatus.APPROVED) {
      updateData.rejectionReason = null;
    } else if (dto.status === BrandStatus.REJECTED) {
      updateData.rejectionReason = dto.rejectionReason;
    }

    const brand = await this.sellerBrandModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .populate('sellerId', 'firstName lastName brandName email')
      .lean();

    if (!brand) {
      throw new NotFoundException('SELLER_BRAND_NOT_FOUND');
    }

    return brand as SellerBrand;
  }

  async remove(id: string, sellerId?: string): Promise<{ deleted: true }> {
    const brand = await this.sellerBrandModel.findById(id).lean();
    if (!brand) throw new NotFoundException('SELLER_BRAND_NOT_FOUND');

    // If seller is deleting, ensure they own this brand
    if (sellerId && brand.sellerId.toString() !== sellerId) {
      throw new BadRequestException('You can only delete your own brands');
    }

    await this.sellerBrandModel.findByIdAndDelete(id);
    return { deleted: true };
  }

  async removeMany(
    ids: string[],
    sellerId?: string,
  ): Promise<{ deletedCount: number }> {
    if (!ids || !ids.length) {
      throw new BadRequestException('No brand IDs provided');
    }

    // If seller, ensure they own all brands they are trying to delete
    if (sellerId) {
      const brands = await this.sellerBrandModel
        .find({ _id: { $in: ids } })
        .select('sellerId')
        .lean();

      if (brands.length !== ids.length) {
        throw new NotFoundException('One or more brands not found');
      }

      const unauthorized = brands.some(
        (brand) => brand.sellerId.toString() !== sellerId,
      );

      if (unauthorized) {
        throw new BadRequestException('You can only delete your own brands');
      }
    }

    const result = await this.sellerBrandModel.deleteMany({ _id: { $in: ids } });
    return { deletedCount: result.deletedCount || 0 };
  }
}










