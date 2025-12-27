import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  SellerWishlist,
  SellerWishlistDocument,
} from './entities/seller-wishlist.entity';
import { AddProductToWishlistDto } from './dto/add-product-to-wishlist.dto';
import { RemoveProductFromWishlistDto } from './dto/remove-product-from-wishlist.dto';

@Injectable()
export class SellerWishlistsService {
  constructor(
    @InjectModel(SellerWishlist.name)
    private sellerWishlistModel: Model<SellerWishlistDocument>,
  ) {}

  async create(sellerId: string): Promise<SellerWishlistDocument> {
    // Check if wishlist already exists
    const existing = await this.sellerWishlistModel.findOne({ sellerId });
    if (existing) {
      return existing;
    }

    return await this.sellerWishlistModel.create({ sellerId, products: [] });
  }

  async findBySellerId(sellerId: string): Promise<SellerWishlist> {
    let wishlist = await this.sellerWishlistModel
      .findOne({ sellerId })
      .populate({
        path: 'products',
        select: 'nameEn nameAr descriptionEn descriptionAr permalink sku originalPrice salePrice discountAmount discountPercantge featuredImages galleryImages active stockStatus stockQuantity brand category subcategory',
        populate: [
          { path: 'brand', select: 'nameEn nameAr' },
          { path: 'category', select: 'name nameAr' },
          { path: 'subcategory', select: 'name nameAr' },
        ],
      })
      .populate('sellerId', 'firstName lastName brandName email')
      .lean();

    // If wishlist doesn't exist, create it
    if (!wishlist) {
      const newWishlist = await this.create(sellerId);
      wishlist = await this.sellerWishlistModel
        .findById((newWishlist as any)._id)
        .populate({
          path: 'products',
          select: 'nameEn nameAr descriptionEn descriptionAr permalink sku originalPrice salePrice discountAmount discountPercantge featuredImages galleryImages active stockStatus stockQuantity brand category subcategory',
          populate: [
            { path: 'brand', select: 'nameEn nameAr' },
            { path: 'category', select: 'name nameAr' },
            { path: 'subcategory', select: 'name nameAr' },
          ],
        })
        .populate('sellerId', 'firstName lastName brandName email')
        .lean();
    }

    return wishlist as SellerWishlist;
  }

  async findAll(query: {
    page?: number;
    limit?: number;
    sellerId?: string;
  }): Promise<{ data: SellerWishlist[]; total: number }> {
    const page = query.page > 0 ? query.page : 1;
    const limit = query.limit > 0 ? query.limit : 10;
    const skip = (page - 1) * limit;

    const filter: any = {};

    // If sellerId is provided, filter by it
    if (query.sellerId) {
      filter.sellerId = query.sellerId;
    }

    const total = await this.sellerWishlistModel.countDocuments(filter);

    const wishlists = await this.sellerWishlistModel
      .find(filter)
      .populate({
        path: 'products',
        select: 'nameEn nameAr descriptionEn descriptionAr permalink sku originalPrice salePrice discountAmount discountPercantge featuredImages galleryImages active stockStatus stockQuantity brand category subcategory',
        populate: [
          { path: 'brand', select: 'nameEn nameAr' },
          { path: 'category', select: 'name nameAr' },
          { path: 'subcategory', select: 'name nameAr' },
        ],
      })
      .populate('sellerId', 'firstName lastName brandName email')
      .skip(skip)
      .limit(limit)
      .sort({ updatedAt: -1 })
      .lean();

    return { data: wishlists as SellerWishlist[], total };
  }

  async addProducts(
    sellerId: string,
    dto: AddProductToWishlistDto,
  ): Promise<SellerWishlist> {
    // Ensure wishlist exists
    let wishlist = await this.sellerWishlistModel.findOne({ sellerId });
    if (!wishlist) {
      wishlist = await this.create(sellerId) as any;
    }

    // Get current products
    const currentProducts = wishlist.products.map((p) => p.toString());

    // Add new products (avoid duplicates)
    const newProductIds = dto.productIds.filter(
      (id) => !currentProducts.includes(id),
    );

    if (newProductIds.length === 0) {
      throw new BadRequestException('All products are already in the wishlist');
    }

    // Add new products to the array
    wishlist.products.push(...(newProductIds as any));

    const updated = await this.sellerWishlistModel
      .findByIdAndUpdate(wishlist._id, { products: wishlist.products }, { new: true })
      .populate({
        path: 'products',
        select: 'nameEn nameAr descriptionEn descriptionAr permalink sku originalPrice salePrice discountAmount discountPercantge featuredImages galleryImages active stockStatus stockQuantity brand category subcategory',
        populate: [
          { path: 'brand', select: 'nameEn nameAr' },
          { path: 'category', select: 'name nameAr' },
          { path: 'subcategory', select: 'name nameAr' },
        ],
      })
      .populate('sellerId', 'firstName lastName brandName email')
      .lean();

    return updated as SellerWishlist;
  }

  async removeProducts(
    sellerId: string,
    dto: RemoveProductFromWishlistDto,
  ): Promise<SellerWishlist> {
    const wishlist = await this.sellerWishlistModel.findOne({ sellerId });
    if (!wishlist) {
      throw new NotFoundException('Wishlist not found');
    }

    // Remove products from the array
    const currentProducts = wishlist.products.map((p) => p.toString());
    const remainingProducts = currentProducts.filter(
      (id) => !dto.productIds.includes(id),
    );

    const updated = await this.sellerWishlistModel
      .findByIdAndUpdate(
        wishlist._id,
        { products: remainingProducts },
        { new: true },
      )
      .populate({
        path: 'products',
        select: 'nameEn nameAr descriptionEn descriptionAr permalink sku originalPrice salePrice discountAmount discountPercantge featuredImages galleryImages active stockStatus stockQuantity brand category subcategory',
        populate: [
          { path: 'brand', select: 'nameEn nameAr' },
          { path: 'category', select: 'name nameAr' },
          { path: 'subcategory', select: 'name nameAr' },
        ],
      })
      .populate('sellerId', 'firstName lastName brandName email')
      .lean();

    return updated as SellerWishlist;
  }

  async clearWishlist(sellerId: string): Promise<SellerWishlist> {
    const wishlist = await this.sellerWishlistModel.findOne({ sellerId });
    if (!wishlist) {
      throw new NotFoundException('Wishlist not found');
    }

    const updated = await this.sellerWishlistModel
      .findByIdAndUpdate(wishlist._id, { products: [] }, { new: true })
      .populate({
        path: 'products',
        select: 'nameEn nameAr descriptionEn descriptionAr permalink sku originalPrice salePrice discountAmount discountPercantge featuredImages galleryImages active stockStatus stockQuantity brand category subcategory',
        populate: [
          { path: 'brand', select: 'nameEn nameAr' },
          { path: 'category', select: 'name nameAr' },
          { path: 'subcategory', select: 'name nameAr' },
        ],
      })
      .populate('sellerId', 'firstName lastName brandName email')
      .lean();

    return updated as SellerWishlist;
  }

  async remove(sellerId: string): Promise<{ deleted: true }> {
    const wishlist = await this.sellerWishlistModel.findOneAndDelete({ sellerId });
    if (!wishlist) {
      throw new NotFoundException('Wishlist not found');
    }
    return { deleted: true };
  }
}

