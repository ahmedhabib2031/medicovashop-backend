import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  SellerDocument,
  SellerDocumentDocument,
  DocumentStatus,
} from './entities/seller-document.entity';
import { UploadSellerDocumentDto } from './dto/upload-seller-document.dto';
import { UpdateDocumentStatusDto } from './dto/update-document-status.dto';

@Injectable()
export class SellerDocumentsService {
  constructor(
    @InjectModel(SellerDocument.name)
    private sellerDocumentModel: Model<SellerDocumentDocument>,
  ) {}

  async create(
    sellerId: string,
    dto: UploadSellerDocumentDto,
  ): Promise<SellerDocument> {
    // Check if seller already has a document
    const existingDoc = await this.sellerDocumentModel.findOne({ sellerId });
    if (existingDoc) {
      throw new BadRequestException('SELLER_DOCUMENT_EXISTS');
    }

    return await this.sellerDocumentModel.create({
      sellerId,
      ...dto,
      status: DocumentStatus.PENDING,
    });
  }

  async update(
    sellerId: string,
    dto: UploadSellerDocumentDto,
  ): Promise<SellerDocument> {
    const document = await this.sellerDocumentModel.findOneAndUpdate(
      { sellerId },
      { ...dto, status: DocumentStatus.PENDING },
      { new: true, upsert: false },
    )
      .populate('sellerId', 'firstName lastName brandName email')
      .lean();

    if (!document) {
      throw new NotFoundException('SELLER_DOCUMENT_NOT_FOUND');
    }

    return document as SellerDocument;
  }

  async findAll(query: {
    page?: number;
    limit?: number;
    status?: DocumentStatus;
    sellerId?: string;
  }): Promise<{ data: SellerDocument[]; total: number }> {
    const page = query.page > 0 ? query.page : 1;
    const limit = query.limit > 0 ? query.limit : 10;
    const skip = (page - 1) * limit;

    const filter: any = {};

    if (query.sellerId) {
      filter.sellerId = query.sellerId;
    }

    if (query.status) {
      filter.status = query.status;
    }

    const total = await this.sellerDocumentModel.countDocuments(filter);

    const documents = await this.sellerDocumentModel
      .find(filter)
      .populate('sellerId', 'firstName lastName brandName email')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .lean();

    return { data: documents as SellerDocument[], total };
  }

  async findOne(id: string): Promise<SellerDocument> {
    const document = await this.sellerDocumentModel
      .findById(id)
      .populate('sellerId', 'firstName lastName brandName email')
      .lean();

    if (!document) {
      throw new NotFoundException('SELLER_DOCUMENT_NOT_FOUND');
    }

    return document as SellerDocument;
  }

  async findBySellerId(sellerId: string): Promise<SellerDocument | null> {
    const document = await this.sellerDocumentModel
      .findOne({ sellerId })
      .populate('sellerId', 'firstName lastName brandName email')
      .lean();

    return document as SellerDocument | null;
  }

  async updateStatus(
    id: string,
    dto: UpdateDocumentStatusDto,
  ): Promise<SellerDocument> {
    // If status is rejected, require rejection reason
    if (
      dto.status === DocumentStatus.REJECTED &&
      (!dto.rejectionReason || dto.rejectionReason.trim() === '')
    ) {
      throw new BadRequestException('Rejection reason is required');
    }

    // If status is approved, clear rejection reason
    const updateData: any = {
      status: dto.status,
    };

    if (dto.status === DocumentStatus.APPROVED) {
      updateData.rejectionReason = null;
    } else if (dto.status === DocumentStatus.REJECTED) {
      updateData.rejectionReason = dto.rejectionReason;
    }

    const document = await this.sellerDocumentModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .populate('sellerId', 'firstName lastName brandName email')
      .lean();

    if (!document) {
      throw new NotFoundException('SELLER_DOCUMENT_NOT_FOUND');
    }

    return document as SellerDocument;
  }

  async remove(id: string): Promise<{ deleted: true }> {
    const document = await this.sellerDocumentModel.findByIdAndDelete(id);
    if (!document) {
      throw new NotFoundException('SELLER_DOCUMENT_NOT_FOUND');
    }
    return { deleted: true };
  }
}



