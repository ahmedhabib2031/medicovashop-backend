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
    const sellerId = req.user.role === UserRole.SELLER ? req.user.userId : undefined;
    const inventory = await this.inventoryService.create(dto, sellerId);
    const lang = this.getLang(req);
    return formatResponse(
      inventory,
      await this.i18n.t('inventory.INVENTORY_CREATED', { lang }),
    );
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.SELLER)
  @ApiOperation({ summary: 'Get all inventory items' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'productId', required: false, type: String })
  @ApiQuery({
    name: 'minQuantity',
    required: false,
    type: Number,
    description: 'Minimum total quantity filter',
  })
  @ApiQuery({
    name: 'maxQuantity',
    required: false,
    type: Number,
    description: 'Maximum total quantity filter',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['in_stock', 'out_of_stock'],
    description: 'Filter by stock status: in_stock (quantity > 0) or out_of_stock (quantity <= 0)',
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
    @Query('minQuantity') minQuantity?: string,
    @Query('maxQuantity') maxQuantity?: string,
    @Query('status') status?: string,
    @Request() req?,
  ) {
    const sellerId = req.user.role === UserRole.SELLER ? req.user.userId : undefined;
    const result = await this.inventoryService.findAll(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 10,
      search,
      productId,
      sellerId,
      status,
      minQuantity ? parseInt(minQuantity) : undefined,
      maxQuantity ? parseInt(maxQuantity) : undefined,
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
    const sellerId = req.user.role === UserRole.SELLER ? req.user.userId : undefined;
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
    const sellerId = req.user.role === UserRole.SELLER ? req.user.userId : undefined;
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
    const sellerId = req.user.role === UserRole.SELLER ? req.user.userId : undefined;
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
    const sellerId = req.user.role === UserRole.SELLER ? req.user.userId : undefined;
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
    const sellerId = req.user.role === UserRole.SELLER ? req.user.userId : undefined;
    await this.inventoryService.remove(id, sellerId);
    const lang = this.getLang(req);
    return formatResponse(
      null,
      await this.i18n.t('inventory.INVENTORY_DELETED', { lang }),
    );
  }
}
// - get all product and get product by it now public 








