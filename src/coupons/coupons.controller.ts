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
  Query,
  ForbiddenException,
  BadRequestException,
  Patch,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { DiscountsService } from './coupons.service';
import {
  CreateDiscountDto,
  DiscountMethod,
  CouponType,
} from './dto/create-coupon.dto';
import { UpdateDiscountDto } from './dto/update-coupon.dto';
import { UpdateDiscountStatusDto } from './dto/update-discount-status.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { I18nService } from 'nestjs-i18n';
import { formatResponse } from '../common/utils/response.util';

@ApiTags('Coupons')
@ApiBearerAuth('JWT-auth')
@Controller('coupons')
@UseGuards(JwtAuthGuard, RolesGuard)
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
  @Roles(UserRole.ADMIN, UserRole.SELLER)
  @ApiOperation({
    summary: 'Create a new discount/coupon',
    description: 'Create a new discount with all configuration options. Discount code will be auto-generated if method is discount_code and code is not provided. Seller ID is automatically extracted from token for sellers, or can be specified by admin.',
  })
  @ApiResponse({ status: 201, description: 'Discount created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request data or discount code already exists' })
  async create(@Body() dto: CreateDiscountDto, @Req() req) {
    // If seller is creating, automatically set sellerId from token
    if (req.user.role === UserRole.SELLER) {
      dto.sellerId = req.user.id;
    } else if (req.user.role === UserRole.ADMIN) {
      // Admin can optionally provide sellerId, but it's not required
      // If not provided, discount will be global (no sellerId)
    }

    const discount = await this.discountsService.create(dto);
    const lang = this.getLang(req);
    return formatResponse(
      discount,
      await this.i18n.t('discount.DISCOUNT_CREATED', { lang }),
    );
  }

  @Get('generate-code')
  @Roles(UserRole.ADMIN, UserRole.SELLER)
  @ApiOperation({
    summary: 'Generate random discount code',
    description: 'Generate a unique random discount code that can be used when creating a discount with discount_code method',
  })
  @ApiResponse({ status: 200, description: 'Discount code generated successfully' })
  async generateCode(@Req() req) {
    const code = await this.discountsService.generateUniqueCode();
    const lang = this.getLang(req);
    return formatResponse(
      { discountCode: code },
      await this.i18n.t('discount.CODE_GENERATED', { lang }),
    );
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.SELLER)
  @ApiOperation({
    summary: 'Get all discounts/coupons',
    description: 'Get all discounts with pagination, search, and filtering options (Admin sees all, Seller sees only their discounts)',
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'method', required: false, enum: DiscountMethod })
  @ApiQuery({ name: 'discountType', required: false, enum: CouponType })
  @ApiQuery({ name: 'active', required: false, type: Boolean })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: String,
    description: 'Filter discounts that start on or after this date (ISO format: YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: String,
    description: 'Filter discounts that end on or before this date (ISO format: YYYY-MM-DD)',
  })
  @ApiResponse({ status: 200, description: 'Discounts fetched successfully' })
  async findAll(
    @Query('page') page,
    @Query('limit') limit,
    @Query('search') search,
    @Query('method') method,
    @Query('discountType') discountType,
    @Query('active') active,
    @Query('startDate') startDate,
    @Query('endDate') endDate,
    @Req() req,
  ) {
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const activeBool = active === 'true' ? true : active === 'false' ? false : undefined;

    const query: any = {
      page: pageNum,
      limit: limitNum,
      search,
      method,
      discountType,
      active: activeBool,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    };

    // If seller, only show their discounts
    if (req.user.role === UserRole.SELLER) {
      query.sellerId = req.user.id;
    }

    const result = await this.discountsService.findAll(query);
    const totalPages = Math.ceil(result.total / limitNum);

    const lang = this.getLang(req);

    return formatResponse(
      {
        discounts: result.data,
        total: result.total,
        page: pageNum,
        limit: limitNum,
        next: pageNum < totalPages,
        previous: pageNum > 1,
      },
      await this.i18n.t('discount.DISCOUNTS_FETCHED', { lang }),
    );
  }

  @Get('code/:code')
  @Roles(UserRole.ADMIN, UserRole.SELLER)
  @ApiOperation({
    summary: 'Get discount by code',
    description: 'Get discount details by discount code (for validation at checkout)',
  })
  @ApiParam({ name: 'code', description: 'Discount code' })
  @ApiResponse({ status: 200, description: 'Discount fetched successfully' })
  @ApiResponse({ status: 404, description: 'Discount code not found or inactive' })
  async findByCode(@Param('code') code: string, @Req() req) {
    const discount = await this.discountsService.findByCode(code);
    const lang = this.getLang(req);
    return formatResponse(
      discount,
      await this.i18n.t('discount.DISCOUNT_FETCHED', { lang }),
    );
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.SELLER)
  @ApiOperation({
    summary: 'Get discount by ID',
    description: 'Get a specific discount by its ID (Admin can access any, Seller can only access their own)',
  })
  @ApiParam({ name: 'id', description: 'Discount ID' })
  @ApiResponse({ status: 200, description: 'Discount fetched successfully' })
  @ApiResponse({ status: 404, description: 'Discount not found' })
  async findOne(@Param('id') id: string, @Req() req) {
    const discount = await this.discountsService.findOne(id);

    // If seller, ensure they can only access their own discount
    if (req.user.role === UserRole.SELLER) {
      const discountSellerId =
        (discount as any).sellerId?._id?.toString() ||
        (discount as any).sellerId?.toString();
      if (discountSellerId && discountSellerId !== req.user.id) {
        throw new ForbiddenException('Access denied');
      }
    }

    const lang = this.getLang(req);
    return formatResponse(
      discount,
      await this.i18n.t('discount.DISCOUNT_FETCHED', { lang }),
    );
  }

  @Put(':id')
  @Roles(UserRole.ADMIN, UserRole.SELLER)
  @ApiOperation({
    summary: 'Update discount',
    description: 'Update an existing discount (Admin can update any, Seller can only update their own)',
  })
  @ApiParam({ name: 'id', description: 'Discount ID' })
  @ApiResponse({ status: 200, description: 'Discount updated successfully' })
  @ApiResponse({ status: 404, description: 'Discount not found' })
  @ApiResponse({ status: 400, description: 'Invalid request data or discount code already exists' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateDiscountDto,
    @Req() req,
  ) {
    const sellerId =
      req.user.role === UserRole.SELLER ? req.user.id : undefined;
    const discount = await this.discountsService.update(id, dto, sellerId);
    const lang = this.getLang(req);
    return formatResponse(
      discount,
      await this.i18n.t('discount.DISCOUNT_UPDATED', { lang }),
    );
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.SELLER)
  @ApiOperation({
    summary: 'Delete discount',
    description: 'Delete a discount permanently (Admin can delete any, Seller can only delete their own)',
  })
  @ApiParam({ name: 'id', description: 'Discount ID' })
  @ApiResponse({ status: 200, description: 'Discount deleted successfully' })
  @ApiResponse({ status: 404, description: 'Discount not found' })
  async remove(@Param('id') id: string, @Req() req) {
    const sellerId =
      req.user.role === UserRole.SELLER ? req.user.id : undefined;
    await this.discountsService.remove(id, sellerId);
    const lang = this.getLang(req);
    return formatResponse(
      null,
      await this.i18n.t('discount.DISCOUNT_DELETED', { lang }),
    );
  }

  @Patch(':id/status')
  @Roles(UserRole.ADMIN, UserRole.SELLER)
  @ApiOperation({
    summary: 'Update discount status',
    description: 'Update discount active status (Admin can update any, Seller can only update their own)',
  })
  @ApiParam({ name: 'id', description: 'Discount ID' })
  @ApiResponse({
    status: 200,
    description: 'Discount status updated successfully',
  })
  @ApiResponse({ status: 404, description: 'Discount not found' })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateDiscountStatusDto,
    @Req() req,
  ) {
    const sellerId =
      req.user.role === UserRole.SELLER ? req.user.id : undefined;
    const discount = await this.discountsService.updateStatus(
      id,
      dto.active,
      sellerId,
    );
    const lang = this.getLang(req);
    return formatResponse(
      discount,
      await this.i18n.t('discount.STATUS_UPDATE_SUCCESS', { lang }),
    );
  }

  @Delete()
  @Roles(UserRole.ADMIN, UserRole.SELLER)
  @ApiOperation({
    summary: 'Bulk delete discounts',
    description:
      'Delete multiple discounts at once. Admin can delete any, Seller can only delete their own discounts.',
  })
  @ApiQuery({
    name: 'ids',
    required: true,
    type: String,
    description:
      'Comma-separated list of discount IDs to delete (e.g. id1,id2,id3)',
  })
  @ApiResponse({
    status: 200,
    description: 'Discounts deleted successfully',
  })
  async bulkRemove(@Query('ids') ids: string, @Req() req) {
    const idList = ids
      ?.split(',')
      .map((id) => id.trim())
      .filter(Boolean);

    if (!idList.length) {
      throw new BadRequestException('No discount IDs provided');
    }

    const sellerId =
      req.user.role === UserRole.SELLER ? req.user.id : undefined;

    const result = await this.discountsService.removeMany(idList, sellerId);

    const lang = this.getLang(req);
    return formatResponse(
      {
        deletedCount: result.deletedCount,
        ids: idList,
      },
      await this.i18n.t('discount.DISCOUNT_DELETED', { lang }),
    );
  }
}
