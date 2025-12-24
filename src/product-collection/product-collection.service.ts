import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  ProductCollection,
  ProductCollectionDocument,
} from './entities/product-collection.entity';
import { CreateProductCollectionDto } from './dto/create-product-collection.dto';
import { UpdateProductCollectionDto } from './dto/update-product-collection.dto';

@Injectable()
export class ProductCollectionService {
  constructor(
    @InjectModel(ProductCollection.name)
    private productCollectionModel: Model<ProductCollectionDocument>,
  ) {}

  async create(
    dto: CreateProductCollectionDto,
  ): Promise<ProductCollection> {
    // Ensure sellerId is provided
    if (!dto.sellerId) {
      throw new BadRequestException('Seller ID is required');
    }

    return await this.productCollectionModel.create(dto);
  }

  async findAll(query: {
    page?: number;
    limit?: number;
    search?: string;
    sellerId?: string;
    status?: boolean;
    isFeatures?: boolean;
  }): Promise<{ data: ProductCollection[]; total: number }> {
    const page = query.page > 0 ? query.page : 1;
    const limit = query.limit > 0 ? query.limit : 10;
    const skip = (page - 1) * limit;

    const filter: any = {};

    // If sellerId is provided, filter by it
    if (query.sellerId) {
      filter.sellerId = query.sellerId;
    }

    // Filter by status if provided
    if (query.status !== undefined) {
      filter.status = query.status;
    }

    // Filter by isFeatures if provided
    if (query.isFeatures !== undefined) {
      filter.isFeatures = query.isFeatures;
    }

    // Search filter
    if (query.search) {
      const regex = new RegExp(query.search, 'i');
      filter.$or = [
        { nameAr: regex },
        { nameEn: regex },
        { descriptionAr: regex },
        { descriptionEn: regex },
      ];
    }

    const total = await this.productCollectionModel.countDocuments(filter);

    const collections = await this.productCollectionModel
      .find(filter)
      .populate('sellerId', 'firstName lastName brandName email')
      .populate('products', 'nameEn nameAr sku')
      .populate('descriptiveData')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .lean();

    return { data: collections as ProductCollection[], total };
  }

  async findOne(id: string): Promise<ProductCollection> {
    const collection = await this.productCollectionModel
      .findById(id)
      .populate('sellerId', 'firstName lastName brandName email')
      .populate('products', 'nameEn nameAr sku')
      .populate('descriptiveData')
      .lean();
    if (!collection)
      throw new NotFoundException('PRODUCT_COLLECTION_NOT_FOUND');
    return collection as ProductCollection;
  }

  async findBySellerId(sellerId: string): Promise<ProductCollection[]> {
    const collections = await this.productCollectionModel
      .find({ sellerId })
      .populate('sellerId', 'firstName lastName brandName email')
      .populate('products', 'nameEn nameAr sku')
      .populate('descriptiveData')
      .sort({ createdAt: -1 })
      .lean();
    return collections as ProductCollection[];
  }

  async update(
    id: string,
    dto: UpdateProductCollectionDto,
    sellerId?: string,
  ): Promise<ProductCollection> {
    const collection = await this.productCollectionModel.findById(id).lean();
    if (!collection)
      throw new NotFoundException('PRODUCT_COLLECTION_NOT_FOUND');

    // If seller is updating, ensure they own this collection
    if (sellerId && collection.sellerId.toString() !== sellerId) {
      throw new BadRequestException(
        'You can only update your own collections',
      );
    }

    const updated = await this.productCollectionModel
      .findByIdAndUpdate(id, dto, { new: true })
      .populate('sellerId', 'firstName lastName brandName email')
      .populate('products', 'nameEn nameAr sku')
      .populate('descriptiveData')
      .lean();
    return updated as ProductCollection;
  }

  async remove(id: string, sellerId?: string): Promise<{ deleted: true }> {
    const collection = await this.productCollectionModel.findById(id).lean();
    if (!collection)
      throw new NotFoundException('PRODUCT_COLLECTION_NOT_FOUND');

    // If seller is deleting, ensure they own this collection
    if (sellerId && collection.sellerId.toString() !== sellerId) {
      throw new BadRequestException(
        'You can only delete your own collections',
      );
    }

    await this.productCollectionModel.findByIdAndDelete(id);
    return { deleted: true };
  }

  async removeMany(
    ids: string[],
    sellerId?: string,
  ): Promise<{ deletedCount: number }> {
    if (!ids || !ids.length) {
      throw new BadRequestException('No collection IDs provided');
    }

    // If seller, ensure they own all collections they are trying to delete
    if (sellerId) {
      const collections = await this.productCollectionModel
        .find({ _id: { $in: ids } })
        .select('sellerId')
        .lean();

      if (collections.length !== ids.length) {
        throw new NotFoundException('One or more collections not found');
      }

      const unauthorized = collections.some(
        (collection) => collection.sellerId.toString() !== sellerId,
      );

      if (unauthorized) {
        throw new BadRequestException(
          'You can only delete your own collections',
        );
      }
    }

    const result = await this.productCollectionModel.deleteMany({
      _id: { $in: ids },
    });
    return { deletedCount: result.deletedCount || 0 };
  }
}



