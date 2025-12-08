import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SellerStore, SellerStoreDocument } from './entities/seller-store.entity';
import { CreateSellerStoreDto } from './dto/create-seller-store.dto';
import { UpdateSellerStoreDto } from './dto/update-seller-store.dto';
import { UpdateSellerStoreStatusDto } from './dto/update-seller-store-status.dto';

@Injectable()
export class SellerStoreService {
  constructor(
    @InjectModel(SellerStore.name)
    private sellerStoreModel: Model<SellerStoreDocument>,
  ) {}

  async create(dto: CreateSellerStoreDto): Promise<SellerStore> {
    // Ensure sellerId is provided
    if (!dto.sellerId) {
      throw new BadRequestException('Seller ID is required');
    }

    // Check if seller already has a store
    const existingStore = await this.sellerStoreModel.findOne({
      sellerId: dto.sellerId,
    });
    if (existingStore) {
      throw new BadRequestException('SELLER_STORE_EXISTS');
    }

    return await this.sellerStoreModel.create(dto);
  }

  async findAll(query: {
    page?: number;
    limit?: number;
    search?: string;
    sellerId?: string;
  }): Promise<{ data: SellerStore[]; total: number }> {
    const page = query.page > 0 ? query.page : 1;
    const limit = query.limit > 0 ? query.limit : 10;
    const skip = (page - 1) * limit;

    const filter: any = {};

    // If sellerId is provided, filter by it
    if (query.sellerId) {
      filter.sellerId = query.sellerId;
    }

    // Search filter
    if (query.search) {
      const regex = new RegExp(query.search, 'i');
      filter.$or = [
        { name: regex },
        { address: regex },
        { storeEmail: regex },
        { storePhone: regex },
      ];
    }

    const total = await this.sellerStoreModel.countDocuments(filter);

    const stores = await this.sellerStoreModel
      .find(filter)
      .populate('sellerId', 'firstName lastName brandName email')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .lean();

    return { data: stores as SellerStore[], total };
  }

  async findOne(id: string): Promise<SellerStore> {
    const store = await this.sellerStoreModel
      .findById(id)
      .populate('sellerId', 'firstName lastName brandName email')
      .lean();
    if (!store) throw new NotFoundException('SELLER_STORE_NOT_FOUND');
    return store as SellerStore;
  }

  async findBySellerId(sellerId: string): Promise<SellerStore | null> {
    const store = await this.sellerStoreModel
      .findOne({ sellerId })
      .populate('sellerId', 'firstName lastName brandName email')
      .lean();
    return store as SellerStore | null;
  }

  async update(id: string, dto: UpdateSellerStoreDto): Promise<SellerStore> {
    const store = await this.sellerStoreModel
      .findByIdAndUpdate(id, dto, { new: true })
      .populate('sellerId', 'firstName lastName brandName email')
      .lean();
    if (!store) throw new NotFoundException('SELLER_STORE_NOT_FOUND');
    return store as SellerStore;
  }

  async updateStatus(
    id: string,
    dto: UpdateSellerStoreStatusDto,
  ): Promise<SellerStore> {
    const store = await this.sellerStoreModel
      .findByIdAndUpdate(id, { active: dto.active }, { new: true })
      .populate('sellerId', 'firstName lastName brandName email')
      .lean();
    if (!store) throw new NotFoundException('SELLER_STORE_NOT_FOUND');
    return store as SellerStore;
  }

  async remove(id: string): Promise<{ deleted: true }> {
    const store = await this.sellerStoreModel.findByIdAndDelete(id);
    if (!store) throw new NotFoundException('SELLER_STORE_NOT_FOUND');
    return { deleted: true };
  }
}

