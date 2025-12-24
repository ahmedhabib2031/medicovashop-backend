import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Req,
  Query,
  BadRequestException,
  UseGuards,
  Patch,
  ForbiddenException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { SellerBrandsService } from './seller-brands.service';
import { CreateSellerBrandDto } from './dto/create-seller-brand.dto';
import { UpdateSellerBrandDto } from './dto/update-seller-brand.dto';
import { UpdateBrandStatusDto } from './dto/update-brand-status.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { I18nService } from 'nestjs-i18n';
import { formatResponse } from '../common/utils/response.util';
import { BrandStatus } from './entities/seller-brand.entity';

@ApiTags('Seller Brands')
@ApiBearerAuth('JWT-auth')
@Controller('seller-brands')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SellerBrandsController {
  constructor(
    private readonly sellerBrandsService: SellerBrandsService,
    private readonly i18n: I18nService,
  ) {}

  private getLang(req: any) {
    return req.headers['accept-language']?.split(',')[0] || 'en';
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.SELLER)
  @ApiOperation({
    summary: 'Create seller brand',
    description:
      'Create a new seller brand. Seller ID is automatically extracted from token for sellers, or can be specified by admin. Status will be set to PENDING.',
  })
  @ApiResponse({ status: 201, description: 'Brand created successfully' })
  @ApiResponse({ status: 400, description: 'Brand name already exists for this seller' })
  async create(@Body() dto: CreateSellerBrandDto, @Req() req) {
    // If seller is creating, automatically set sellerId from token
    if (req.user.role === UserRole.SELLER) {
      dto.sellerId = req.user.id;
    } else if (req.user.role === UserRole.ADMIN) {
      // Admin must provide sellerId
      if (!dto.sellerId) {
        throw new BadRequestException('Seller ID is required');
      }
    }

    try {
      const brand = await this.sellerBrandsService.create(dto);
      const lang = this.getLang(req);
      return formatResponse(
        brand,
        await this.i18n.t('sellerBrand.CREATE_SUCCESS', { lang }),
      );
    } catch (err) {
      const lang = this.getLang(req);
      throw new BadRequestException(
        formatResponse(
          null,
          await this.i18n.t('sellerBrand.CREATE_FAILED', { lang }),
          'error',
        ),
      );
    }
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.SELLER)
  @ApiOperation({
    summary: 'Get all seller brands',
    description:
      'Get all brands with pagination, search, and status filter (Admin sees all, Seller sees only their brands)',
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, enum: BrandStatus })
  @ApiResponse({ status: 200, description: 'Brands fetched successfully' })
  async findAll(
    @Query('page') page,
    @Query('limit') limit,
    @Query('search') search,
    @Query('status') status,
    @Req() req,
  ) {
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;

    const query: any = { page: pageNum, limit: limitNum, search };
    if (status) {
      query.status = status;
    }

    // If seller, only show their brands
    if (req.user.role === UserRole.SELLER) {
      query.sellerId = req.user.id;
    }

    const result = await this.sellerBrandsService.findAll(query);
    const totalPages = Math.ceil(result.total / limitNum);

    const lang = this.getLang(req);

    return formatResponse(
      {
        brands: result.data,
        total: result.total,
        page: pageNum,
        limit: limitNum,
        next: pageNum < totalPages,
        previous: pageNum > 1,
      },
      await this.i18n.t('sellerBrand.FETCH_SUCCESS', { lang }),
    );
  }

  @Get('me')
  @Roles(UserRole.SELLER)
  @ApiOperation({
    summary: 'Get seller own brands',
    description:
      'Get all brands for the current seller with pagination, search, and optional status filter (Seller only)',
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, enum: BrandStatus })
  @ApiResponse({ status: 200, description: 'Brands fetched successfully' })
  async getMyBrands(
    @Query('page') page,
    @Query('limit') limit,
    @Query('search') search,
    @Query('status') status,
    @Req() req,
  ) {
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;

    const query: any = {
      page: pageNum,
      limit: limitNum,
      search,
      sellerId: req.user.id,
    };

    if (status) {
      query.status = status;
    }

    const result = await this.sellerBrandsService.findAll(query);
    const totalPages = Math.ceil(result.total / limitNum);

    const lang = this.getLang(req);
    return formatResponse(
      {
        brands: result.data,
        total: result.total,
        page: pageNum,
        limit: limitNum,
        next: pageNum < totalPages,
        previous: pageNum > 1,
      },
      await this.i18n.t('sellerBrand.FETCH_SUCCESS', { lang }),
    );
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.SELLER)
  @ApiOperation({
    summary: 'Get seller brand by ID',
    description:
      'Get a specific brand by ID (Admin can access any, Seller can only access their own)',
  })
  @ApiParam({ name: 'id', description: 'Brand ID' })
  @ApiResponse({ status: 200, description: 'Brand fetched successfully' })
  @ApiResponse({ status: 404, description: 'Brand not found' })
  async findOne(@Param('id') id: string, @Req() req) {
    const brand = await this.sellerBrandsService.findOne(id);

    // If seller, ensure they can only access their own brand
    if (req.user.role === UserRole.SELLER) {
      const brandSellerId =
        (brand as any).sellerId?._id?.toString() ||
        (brand as any).sellerId?.toString();
      if (brandSellerId !== req.user.id) {
        throw new ForbiddenException('Access denied');
      }
    }

    const lang = this.getLang(req);
    return formatResponse(
      brand,
      await this.i18n.t('sellerBrand.FETCH_SUCCESS', { lang }),
    );
  }

  @Put(':id')
  @Roles(UserRole.ADMIN, UserRole.SELLER)
  @ApiOperation({
    summary: 'Update seller brand',
    description:
      'Update a brand (Admin can update any, Seller can only update their own pending brands)',
  })
  @ApiParam({ name: 'id', description: 'Brand ID' })
  @ApiResponse({ status: 200, description: 'Brand updated successfully' })
  @ApiResponse({ status: 400, description: 'Only pending brands can be updated' })
  @ApiResponse({ status: 404, description: 'Brand not found' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateSellerBrandDto,
    @Req() req,
  ) {
    const sellerId =
      req.user.role === UserRole.SELLER ? req.user.id : undefined;
    const brand = await this.sellerBrandsService.update(id, dto, sellerId);
    const lang = this.getLang(req);
    return formatResponse(
      brand,
      await this.i18n.t('sellerBrand.UPDATE_SUCCESS', { lang }),
    );
  }

  @Patch(':id/status')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Approve or reject seller brand',
    description:
      'Update brand status to approved, pending, or rejected (Admin only). Rejection reason is required when rejecting.',
  })
  @ApiParam({ name: 'id', description: 'Brand ID' })
  @ApiResponse({
    status: 200,
    description: 'Brand status updated successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Rejection reason required when rejecting',
  })
  @ApiResponse({ status: 404, description: 'Brand not found' })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateBrandStatusDto,
    @Req() req,
  ) {
    const brand = await this.sellerBrandsService.updateStatus(id, dto);
    const lang = this.getLang(req);
    return formatResponse(
      brand,
      await this.i18n.t('sellerBrand.STATUS_UPDATE_SUCCESS', { lang }),
    );
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.SELLER)
  @ApiOperation({
    summary: 'Delete seller brand',
    description:
      'Delete a brand (Admin can delete any, Seller can only delete their own)',
  })
  @ApiParam({ name: 'id', description: 'Brand ID' })
  @ApiResponse({ status: 200, description: 'Brand deleted successfully' })
  @ApiResponse({ status: 404, description: 'Brand not found' })
  async remove(@Param('id') id: string, @Req() req) {
    const sellerId =
      req.user.role === UserRole.SELLER ? req.user.id : undefined;
    await this.sellerBrandsService.remove(id, sellerId);
    const lang = this.getLang(req);
    return formatResponse(
      null,
      await this.i18n.t('sellerBrand.DELETE_SUCCESS', { lang }),
    );
  }

  @Delete()
  @Roles(UserRole.ADMIN, UserRole.SELLER)
  @ApiOperation({
    summary: 'Bulk delete seller brands',
    description:
      'Delete multiple brands at once. Admin can delete any, Seller can only delete their own brands.',
  })
  @ApiQuery({
    name: 'ids',
    required: true,
    type: String,
    description:
      'Comma-separated list of brand IDs to delete (e.g. id1,id2,id3)',
  })
  @ApiResponse({
    status: 200,
    description: 'Brands deleted successfully',
  })
  async bulkRemove(@Query('ids') ids: string, @Req() req) {
    const idList = ids
      ?.split(',')
      .map((id) => id.trim())
      .filter(Boolean);

    if (!idList.length) {
      throw new BadRequestException('No brand IDs provided');
    }

    const sellerId =
      req.user.role === UserRole.SELLER ? req.user.id : undefined;

    const result = await this.sellerBrandsService.removeMany(idList, sellerId);

    const lang = this.getLang(req);
    return formatResponse(
      {
        deletedCount: result.deletedCount,
        ids: idList,
      },
      await this.i18n.t('sellerBrand.DELETE_SUCCESS', { lang }),
    );
  }
}










