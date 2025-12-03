import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { DiscountsService } from './coupons.service';
import { CreateDiscountDto } from './dto/create-coupon.dto';
import { UpdateDiscountDto } from './dto/update-coupon.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@Controller('discounts')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class DiscountsController {
  constructor(private readonly discountsService: DiscountsService) {}

  @Post()
  async create(@Body() dto: CreateDiscountDto) {
    const discount = await this.discountsService.create(dto);
    return {
      message: 'Discount created successfully',
      data: discount,
    };
  }

  @Get()
  async findAll() {
    const discounts = await this.discountsService.findAll();
    return {
      message: 'Discounts fetched successfully',
      data: discounts,
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const discount = await this.discountsService.findOne(id);
    return {
      message: 'Discount fetched successfully',
      data: discount,
    };
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateDiscountDto) {
    const discount = await this.discountsService.update(id, dto);
    return {
      message: 'Discount updated successfully',
      data: discount,
    };
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.discountsService.remove(id);
    return {
      message: 'Discount deleted successfully',
    };
  }
}
