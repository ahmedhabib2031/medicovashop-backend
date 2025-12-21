import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { CreateInventoryDto } from './dto/create-inventory.dto';
import { UpdateInventoryDto } from './dto/update-inventory.dto';
import { UpdateInventoryStatusDto } from './dto/update-inventory-status.dto';
import { UpdateInventoryVariantDto } from './dto/update-inventory-variant.dto';
import { BulkDeleteInventoryDto } from './dto/bulk-delete-inventory.dto';
import { FilterInventoryDto } from './dto/filter-inventory.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { I18nService } from 'nestjs-i18n';
import { formatResponse } from '../common/utils/response.util';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';

@ApiTags('Inventory')
@Controller('/inventory')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class InventoryController {
  constructor(
    private readonly inventoryService: InventoryService,
    private readonly i18n: I18nService,
  ) {}

  private getLang(req: any): string {
    return (
      req.headers['accept-language']?.split(',')[0] ||
      req.user?.language ||
      'en'
    );
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.SELLER)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create product inventory' })
  @ApiResponse({
    status: 201,
    description: 'Inventory created successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async create(@Body() dto: CreateInventoryDto, @Request() req) {
    const sellerId =
      req.user.role === UserRole.SELLER ? req.user.userId : undefined;
    const inventory = await this.inventoryService.create(dto, sellerId);
    const lang = this.getLang(req);
    return formatResponse(
      inventory,
      await this.i18n.t('inventory.INVENTORY_CREATED', { lang }),
    );
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.SELLER)
  @ApiOperation({ summary: 'Get all inventory items (Query Parameters)' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'productId', required: false, type: String })
  @ApiQuery({
    name: 'status',
    required: false,
    type: String,
    enum: ['in_stock', 'out_of_stock'],
    description: 'Filter by inventory stock status (in_stock or out_of_stock)',
  })
  @ApiQuery({
    name: 'minQuantity',
    required: false,
    type: Number,
    description: 'Minimum quantity filter',
    example: 0,
  })
  @ApiQuery({
    name: 'maxQuantity',
    required: false,
    type: Number,
    description: 'Maximum quantity filter',
    example: 100,
  })
  @ApiQuery({
    name: 'sellerStatus',
    required: false,
    type: String,
    enum: ['active', 'inactive'],
    description: 'Filter by seller status (active or inactive)',
  })
  @ApiQuery({
    name: 'qaStatus',
    required: false,
    type: String,
    enum: ['approved', 'pending', 'rejected'],
    description: 'Filter by QA status (approved, pending, or rejected)',
  })
  @ApiQuery({
    name: 'brandId',
    required: false,
    type: String,
    description: 'Filter by brand ID',
  })
  @ApiQuery({
    name: 'categoryId',
    required: false,
    type: String,
    description: 'Filter by category ID',
  })
  @ApiQuery({
    name: 'subcategoryId',
    required: false,
    type: String,
    description: 'Filter by subcategory ID',
  })
  @ApiQuery({
    name: 'minPrice',
    required: false,
    type: Number,
    description:
      'Minimum price filter (uses originalPrice or salePrice if available)',
    example: 0,
  })
  @ApiQuery({
    name: 'maxPrice',
    required: false,
    type: Number,
    description:
      'Maximum price filter (uses originalPrice or salePrice if available)',
    example: 1000,
  })
  @ApiQuery({
    name: 'minRating',
    required: false,
    type: Number,
    description: 'Minimum rating filter (0-5)',
    example: 4,
  })
  @ApiQuery({
    name: 'productStatus',
    required: false,
    type: String,
    enum: ['active', 'inactive'],
    description: 'Filter by product status (active or inactive)',
  })
  @ApiResponse({
    status: 200,
    description: 'Inventory items retrieved successfully',
  })
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('productId') productId?: string,
    @Query('status') status?: string,
    @Query('minQuantity') minQuantity?: string,
    @Query('maxQuantity') maxQuantity?: string,
    @Query('sellerStatus') sellerStatus?: string,
    @Query('qaStatus') qaStatus?: string,
    @Query('brandId') brandId?: string,
    @Query('categoryId') categoryId?: string,
    @Query('subcategoryId') subcategoryId?: string,
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
    @Query('minRating') minRating?: string,
    @Query('productStatus') productStatus?: string,
    @Request() req?,
  ) {
    const sellerId =
      req.user.role === UserRole.SELLER ? req.user.userId : undefined;
    const result = await this.inventoryService.findAll(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 10,
      search,
      productId,
      sellerId,
      status,
      minQuantity ? parseFloat(minQuantity) : undefined,
      maxQuantity ? parseFloat(maxQuantity) : undefined,
      sellerStatus,
      qaStatus,
      brandId,
      categoryId,
      subcategoryId,
      minPrice ? parseFloat(minPrice) : undefined,
      maxPrice ? parseFloat(maxPrice) : undefined,
      minRating ? parseFloat(minRating) : undefined,
      productStatus,
    );
    const lang = this.getLang(req);
    return formatResponse(
      result,
      await this.i18n.t('inventory.INVENTORY_RETRIEVED', { lang }),
    );
  }

  @Post('filter')
  @Roles(UserRole.ADMIN, UserRole.SELLER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get all inventory items with body and query parameters',
    description:
      'Filter inventory items using request body and query parameters',
  })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  @ApiResponse({
    status: 200,
    description: 'Inventory items retrieved successfully',
  })
  async findAllWithBody(
    @Body() filterDto: FilterInventoryDto,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
    @Request() req?,
  ) {
    const sellerId =
      req.user.role === UserRole.SELLER ? req.user.userId : undefined;
    const result = await this.inventoryService.findAllWithFilters(
      {
        page: filterDto.page || 1,
        limit: filterDto.limit || 10,
        search: filterDto.search,
        productId: filterDto.productId,
        productIds: filterDto.productIds,
        status: filterDto.status,
        minQuantity: filterDto.minQuantity,
        maxQuantity: filterDto.maxQuantity,
        active: filterDto.active,
        productStatus: filterDto.productStatus,
        sortBy,
        sortOrder,
      },
      sellerId,
    );
    const lang = this.getLang(req);
    return formatResponse(
      result,
      await this.i18n.t('inventory.INVENTORY_RETRIEVED', { lang }),
    );
  }

  @Post('filter/store/:storeId')
  @Roles(UserRole.ADMIN, UserRole.SELLER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get all inventory items with body, URL, and query parameters',
    description:
      'Filter inventory items using request body, URL parameters (storeId), and query parameters',
  })
  @ApiParam({
    name: 'storeId',
    type: String,
    description: 'Store ID from URL',
  })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  @ApiResponse({
    status: 200,
    description: 'Inventory items retrieved successfully',
  })
  async findAllWithBodyAndUrl(
    @Body() filterDto: FilterInventoryDto,
    @Param('storeId') storeId: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
    @Request() req?,
  ) {
    const sellerId =
      req.user.role === UserRole.SELLER ? req.user.userId : undefined;
    const result = await this.inventoryService.findAllWithFilters(
      {
        page: filterDto.page || 1,
        limit: filterDto.limit || 10,
        search: filterDto.search,
        productId: filterDto.productId,
        productIds: filterDto.productIds,
        status: filterDto.status,
        minQuantity: filterDto.minQuantity,
        maxQuantity: filterDto.maxQuantity,
        active: filterDto.active,
        productStatus: filterDto.productStatus,
        storeId,
        sortBy,
        sortOrder,
      },
      sellerId,
    );
    const lang = this.getLang(req);
    return formatResponse(
      result,
      await this.i18n.t('inventory.INVENTORY_RETRIEVED', { lang }),
    );
  }

  @Get('product/:productId')
  @Roles(UserRole.ADMIN, UserRole.SELLER)
  @ApiOperation({ summary: 'Get inventory by product ID' })
  @ApiParam({ name: 'productId', description: 'Product ID' })
  @ApiResponse({
    status: 200,
    description: 'Inventory retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Inventory not found' })
  async findByProductId(@Param('productId') productId: string, @Request() req) {
    const sellerId =
      req.user.role === UserRole.SELLER ? req.user.userId : undefined;
    const inventory = await this.inventoryService.findByProductId(
      productId,
      sellerId,
    );
    const lang = this.getLang(req);
    return formatResponse(
      inventory,
      await this.i18n.t('inventory.INVENTORY_RETRIEVED', { lang }),
    );
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.SELLER)
  @ApiOperation({ summary: 'Get inventory by ID' })
  @ApiParam({ name: 'id', description: 'Inventory ID' })
  @ApiResponse({
    status: 200,
    description: 'Inventory retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Inventory not found' })
  async findOne(@Param('id') id: string, @Request() req) {
    const sellerId =
      req.user.role === UserRole.SELLER ? req.user.userId : undefined;
    const inventory = await this.inventoryService.findOne(id, sellerId);
    const lang = this.getLang(req);
    return formatResponse(
      inventory,
      await this.i18n.t('inventory.INVENTORY_RETRIEVED', { lang }),
    );
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.SELLER)
  @ApiOperation({ summary: 'Update inventory' })
  @ApiParam({ name: 'id', description: 'Inventory ID' })
  @ApiResponse({
    status: 200,
    description: 'Inventory updated successfully',
  })
  @ApiResponse({ status: 404, description: 'Inventory not found' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateInventoryDto,
    @Request() req,
  ) {
    const sellerId =
      req.user.role === UserRole.SELLER ? req.user.userId : undefined;
    const inventory = await this.inventoryService.update(id, dto, sellerId);
    const lang = this.getLang(req);
    return formatResponse(
      inventory,
      await this.i18n.t('inventory.INVENTORY_UPDATED', { lang }),
    );
  }

  @Patch(':id/status')
  @Roles(UserRole.ADMIN, UserRole.SELLER)
  @ApiOperation({ summary: 'Update inventory status' })
  @ApiParam({ name: 'id', description: 'Inventory ID' })
  @ApiResponse({
    status: 200,
    description: 'Inventory status updated successfully',
  })
  @ApiResponse({ status: 404, description: 'Inventory not found' })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateInventoryStatusDto,
    @Request() req,
  ) {
    const sellerId =
      req.user.role === UserRole.SELLER ? req.user.userId : undefined;
    const inventory = await this.inventoryService.updateStatus(
      id,
      dto,
      sellerId,
    );
    const lang = this.getLang(req);
    return formatResponse(
      inventory,
      await this.i18n.t('inventory.INVENTORY_STATUS_UPDATED', { lang }),
    );
  }

  @Patch(':id/variant/:variantId')
  @Roles(UserRole.ADMIN, UserRole.SELLER)
  @ApiOperation({ summary: 'Update a specific variant in inventory' })
  @ApiParam({ name: 'id', description: 'Inventory ID' })
  @ApiParam({
    name: 'variantId',
    description:
      'Variant ID (MongoDB ObjectId) or variant index (0-based) in the variants array',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Variant updated successfully',
  })
  @ApiResponse({ status: 404, description: 'Inventory or variant not found' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async updateVariant(
    @Param('id') id: string,
    @Param('variantId') variantId: string,
    @Body() dto: UpdateInventoryVariantDto,
    @Request() req,
  ) {
    const sellerId =
      req.user.role === UserRole.SELLER ? req.user.userId : undefined;
    const inventory = await this.inventoryService.updateVariant(
      id,
      variantId,
      dto,
      sellerId,
    );
    const lang = this.getLang(req);
    return formatResponse(
      inventory,
      await this.i18n.t('inventory.VARIANT_UPDATED', { lang }),
    );
  }

  @Delete('bulk')
  @Roles(UserRole.ADMIN, UserRole.SELLER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Bulk delete inventory items or variants',
    description:
      'Delete multiple inventory items or variants. Accepts both inventory IDs and variant IDs. If inventory ID is provided, deletes entire inventory. If variant ID is provided, deletes only that variant.',
  })
  @ApiResponse({
    status: 200,
    description: 'Inventory items or variants deleted successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async bulkRemove(@Body() dto: BulkDeleteInventoryDto, @Request() req) {
    const sellerId =
      req.user.role === UserRole.SELLER ? req.user.userId : undefined;
    const result = await this.inventoryService.bulkRemove(dto.ids, sellerId);
    const lang = this.getLang(req);

    if (result.failedIds.length > 0) {
      return formatResponse(
        result,
        await this.i18n.t('inventory.INVENTORY_BULK_DELETE_PARTIAL', {
          lang,
          args: {
            deleted: result.deletedCount,
            failed: result.failedIds.length,
          },
        }),
      );
    }

    return formatResponse(
      result,
      await this.i18n.t('inventory.INVENTORY_BULK_DELETED', {
        lang,
        args: { count: result.deletedCount },
      }),
    );
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.SELLER)
  @ApiOperation({ summary: 'Delete inventory' })
  @ApiParam({ name: 'id', description: 'Inventory ID' })
  @ApiResponse({
    status: 200,
    description: 'Inventory deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'Inventory not found' })
  async remove(@Param('id') id: string, @Request() req) {
    const sellerId =
      req.user.role === UserRole.SELLER ? req.user.userId : undefined;
    await this.inventoryService.remove(id, sellerId);
    const lang = this.getLang(req);
    return formatResponse(
      null,
      await this.i18n.t('inventory.INVENTORY_DELETED', { lang }),
    );
  }
}
