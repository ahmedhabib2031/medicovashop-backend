import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  CustomerAddress,
  CustomerAddressDocument,
} from './entities/customer-address.entity';
import { CreateCustomerAddressDto } from './dto/create-customer-address.dto';
import { UpdateCustomerAddressDto } from './dto/update-customer-address.dto';
import { UpdateCustomerAddressStatusDto } from './dto/update-customer-address-status.dto';

@Injectable()
export class CustomerAddressesService {
  constructor(
    @InjectModel(CustomerAddress.name)
    private customerAddressModel: Model<CustomerAddressDocument>,
  ) {}

  async create(dto: CreateCustomerAddressDto): Promise<CustomerAddress> {
    // Ensure userId is provided
    if (!dto.userId) {
      throw new BadRequestException('User ID is required');
    }

    // If setting as default, unset all other default addresses for this user
    if (dto.isDefault) {
      await this.customerAddressModel.updateMany(
        { userId: dto.userId, isDefault: true },
        { isDefault: false },
      );
    }

    return await this.customerAddressModel.create(dto);
  }

  async findAll(query: {
    page?: number;
    limit?: number;
    search?: string;
    userId?: string;
  }): Promise<{ data: CustomerAddress[]; total: number }> {
    const page = query.page > 0 ? query.page : 1;
    const limit = query.limit > 0 ? query.limit : 10;
    const skip = (page - 1) * limit;

    const filter: any = {};

    // If userId is provided, filter by it
    if (query.userId) {
      filter.userId = query.userId;
    }

    // Search filter
    if (query.search) {
      const regex = new RegExp(query.search, 'i');
      filter.$or = [
        { addressName: regex },
        { addressDetails: regex },
        { area: regex },
        { city: regex },
      ];
    }

    const total = await this.customerAddressModel.countDocuments(filter);

    const addresses = await this.customerAddressModel
      .find(filter)
      .populate('userId', 'firstName lastName email')
      .skip(skip)
      .limit(limit)
      .sort({ isDefault: -1, createdAt: -1 })
      .lean();

    return { data: addresses as CustomerAddress[], total };
  }

  async findOne(id: string): Promise<CustomerAddress> {
    const address = await this.customerAddressModel
      .findById(id)
      .populate('userId', 'firstName lastName email')
      .lean();
    if (!address) throw new NotFoundException('CUSTOMER_ADDRESS_NOT_FOUND');
    return address as CustomerAddress;
  }

  async findByUserId(userId: string): Promise<CustomerAddress[]> {
    const addresses = await this.customerAddressModel
      .find({ userId })
      .populate('userId', 'firstName lastName email')
      .sort({ isDefault: -1, createdAt: -1 })
      .lean();
    return addresses as CustomerAddress[];
  }

  async update(
    id: string,
    dto: UpdateCustomerAddressDto,
    userId?: string,
  ): Promise<CustomerAddress> {
    const address = await this.customerAddressModel.findById(id).lean();
    if (!address) throw new NotFoundException('CUSTOMER_ADDRESS_NOT_FOUND');

    // If user is updating, ensure they own this address
    if (userId && address.userId.toString() !== userId) {
      throw new BadRequestException('You can only update your own addresses');
    }

    // If setting as default, unset all other default addresses for this user
    if (dto.isDefault) {
      await this.customerAddressModel.updateMany(
        {
          userId: address.userId,
          isDefault: true,
          _id: { $ne: id },
        },
        { isDefault: false },
      );
    }

    const updated = await this.customerAddressModel
      .findByIdAndUpdate(id, dto, { new: true })
      .populate('userId', 'firstName lastName email')
      .lean();
    return updated as CustomerAddress;
  }

  async updateStatus(
    id: string,
    dto: UpdateCustomerAddressStatusDto,
  ): Promise<CustomerAddress> {
    const address = await this.customerAddressModel
      .findByIdAndUpdate(id, { active: dto.active }, { new: true })
      .populate('userId', 'firstName lastName email')
      .lean();
    if (!address) throw new NotFoundException('CUSTOMER_ADDRESS_NOT_FOUND');
    return address as CustomerAddress;
  }

  async remove(id: string, userId?: string): Promise<{ deleted: true }> {
    const address = await this.customerAddressModel.findById(id).lean();
    if (!address) throw new NotFoundException('CUSTOMER_ADDRESS_NOT_FOUND');

    // If user is deleting, ensure they own this address
    if (userId && address.userId.toString() !== userId) {
      throw new BadRequestException('You can only delete your own addresses');
    }

    await this.customerAddressModel.findByIdAndDelete(id);
    return { deleted: true };
  }
}










