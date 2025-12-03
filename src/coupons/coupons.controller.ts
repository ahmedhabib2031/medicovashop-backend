import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { DiscountsService } from './coupons.service';
import { CreateDiscountDto } from './dto/create-coupon.dto';
import { UpdateDiscountDto } from './dto/update-coupon.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { I18nService } from 'nestjs-i18n';

@Controller('discounts')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class DiscountsController {
  constructor(
    private readonly discountsService: DiscountsService,
    private readonly i18n: I18nService,
  ) {}

  // Helper to get language from headers
  private getLang(req: any): string {
    return req.headers['accept-language']?.split(',')[0] || 'en';
  }

  @Post()
  async create(@Body() dto: CreateDiscountDto, @Req() req) {
    const discount = await this.discountsService.create(dto);
    const lang = this.getLang(req);
    return {
      data: discount,
      message: await this.i18n.t('discount.DISCOUNT_CREATED', { lang }),
    };
  }

  @Get()
  async findAll(@Req() req) {
    const discounts = await this.discountsService.findAll();
    const lang = this.getLang(req);
    return {
      data: discounts,
      message: await this.i18n.t('discount.DISCOUNTS_FETCHED', { lang }),
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req) {
    const discount = await this.discountsService.findOne(id);
    const lang = this.getLang(req);
    return {
      data: discount,
      message: await this.i18n.t('discount.DISCOUNT_FETCHED', { lang }),
    };
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateDiscountDto,
    @Req() req,
  ) {
    const discount = await this.discountsService.update(id, dto);
    const lang = this.getLang(req);
    return {
      data: discount,
      message: await this.i18n.t('discount.DISCOUNT_UPDATED', { lang }),
    };
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req) {
    await this.discountsService.remove(id);
    const lang = this.getLang(req);
    return {
      message: await this.i18n.t('discount.DISCOUNT_DELETED', { lang }),
    };
  }
}
