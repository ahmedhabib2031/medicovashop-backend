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
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { UpdateProductStatusDto } from './dto/update-product-status.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { I18nService } from 'nestjs-i18n';
import { formatResponse } from '../common/utils/response.util';
import { SellerStoreService } from '../seller-store/seller-store.service';

@ApiTags('Products')
@ApiBearerAuth('JWT-auth')
@Controller('products')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly i18n: I18nService,
    private readonly sellerStoreService: SellerStoreService,
  ) {}

  private getLang(req: any) {
    return req.headers['accept-language']?.split(',')[0] || 'en';
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.SELLER)
  @ApiOperation({
    summary: 'Create product',
    description: 'Create a new product (Admin or Seller)',
  })
  @ApiResponse({ status: 201, description: 'Product created successfully' })
  @ApiResponse({ status: 400, description: 'SKU already exists or validation error' })
  async create(@Body() dto: CreateProductDto, @Req() req) {
    try {
      const sellerId =
        req.user.role === UserRole.SELLER ? req.user.id || req.user.userId : undefined;
      const adminId =
        req.user.role === UserRole.ADMIN ? req.user.id || req.user.userId : undefined;
      
      // Set createdBy based on role if not provided
      if (!dto.createdBy) {
        dto.createdBy = req.user.role === UserRole.SELLER ? 'seller' : 'admin';
      }
      
      // Validate createdBy matches user role
      if (dto.createdBy === 'seller' && !sellerId) {
        throw new BadRequestException('Seller ID is required when createdBy is seller');
      }
      if (dto.createdBy === 'admin' && !adminId) {
        throw new BadRequestException('Admin ID is required when createdBy is admin');
      }

      // For sellers: store is required - if not provided, get their first store
      if (req.user.role === UserRole.SELLER) {
        if (!dto.store) {
          const sellerStores = await this.sellerStoreService.findBySellerId(sellerId);
          if (!sellerStores || sellerStores.length === 0) {
            throw new BadRequestException('No store found for this seller. Please create a store first or provide a store ID.');
          }
          // Access _id from the lean document
          const firstStore = sellerStores[0] as any;
          dto.store = firstStore._id?.toString() || firstStore.id?.toString();
        }
        // Ensure store is set for sellers (required)
        if (!dto.store) {
          throw new BadRequestException('Store ID is required for seller');
        }
      }

      // For admins: store is optional - can be provided or will be set to null
      // (Admins can create products without a specific store)
      
      const product = await this.productsService.create(dto, sellerId, adminId);
      const lang = this.getLang(req);
      return formatResponse(
        product,
        await this.i18n.t('product.CREATE_SUCCESS', { lang }),
      );
    } catch (err) {
      const lang = this.getLang(req);
      throw new BadRequestException(
        formatResponse(
          null,
          err.message || await this.i18n.t('product.CREATE_FAILED', { lang }),
          'error',
        ),
      );
    }
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.SELLER, UserRole.USER)
  @ApiOperation({
    summary: 'Get all products',
    description: 'Get all products with pagination, search, and filters',
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'category', required: false, type: String })
  @ApiQuery({ name: 'subcategory', required: false, type: String })
  @ApiQuery({ name: 'brand', required: false, type: String })
  @ApiQuery({ name: 'store', required: false, type: String })
  @ApiQuery({ name: 'active', required: false, type: Boolean })
  @ApiQuery({ name: 'minPrice', required: false, type: Number })
  @ApiQuery({ name: 'maxPrice', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Products fetched successfully' })
  async findAll(
    @Query('page') page,
    @Query('limit') limit,
    @Query('search') search,
    @Query('category') category,
    @Query('subcategory') subcategory,
    @Query('brand') brand,
    @Query('store') store,
    @Query('active') active,
    @Query('minPrice') minPrice,
    @Query('maxPrice') maxPrice,
    @Req() req,
  ) {
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;

    const query: any = {
      page: pageNum,
      limit: limitNum,
      search,
      category,
      subcategory,
      brand,
      store,
    };

    // If seller, only show their products (enforce sellerId filter)
    if (req.user.role === UserRole.SELLER) {
      query.sellerId = req.user.id;
      // Sellers can see all their products (active and inactive) for management
      if (active !== undefined) {
        query.active = active === 'true';
      }
    }

    // If user (not admin/seller), only show active products
    if (req.user.role === UserRole.USER) {
      query.active = true;
    } else if (active !== undefined) {
      query.active = active === 'true';
    }

    if (minPrice) {
      query.minPrice = parseFloat(minPrice);
    }
    if (maxPrice) {
      query.maxPrice = parseFloat(maxPrice);
    }

    const result = await this.productsService.findAll(query);
    const totalPages = Math.ceil(result.total / limitNum);

    const lang = this.getLang(req);

    return formatResponse(
      {
        products: result.data,
        total: result.total,
        page: pageNum,
        limit: limitNum,
        next: pageNum < totalPages,
        previous: pageNum > 1,
      },
      await this.i18n.t('product.FETCH_SUCCESS', { lang }),
    );
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.SELLER, UserRole.USER)
  @ApiOperation({
    summary: 'Get product by ID',
    description: 'Get a specific product by ID',
  })
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiResponse({ status: 200, description: 'Product fetched successfully' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async findOne(@Param('id') id: string, @Req() req) {
    const product = await this.productsService.findOne(id);

    // If seller, ensure they can only access their own products
    if (req.user.role === UserRole.SELLER) {
      const productSellerId =
        (product as any).sellerId?._id?.toString() ||
        (product as any).sellerId?.toString();
      // Sellers can only access products that belong to them
      if (!productSellerId || productSellerId !== req.user.id) {
        throw new ForbiddenException('Access denied: You can only access your own products');
      }
    }

    // If user (not admin/seller), only show active products
    if (req.user.role === UserRole.USER && !(product as any).active) {
      throw new ForbiddenException('Product not available');
    }

    const lang = this.getLang(req);
    return formatResponse(
      product,
      await this.i18n.t('product.FETCH_SUCCESS', { lang }),
    );
  }

  @Put(':id')
  @Roles(UserRole.ADMIN, UserRole.SELLER)
  @ApiOperation({
    summary: 'Update product',
    description: 'Update a product (Admin can update any, Seller can only update their own)',
  })
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiResponse({ status: 200, description: 'Product updated successfully' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
    @Req() req,
  ) {
    // If seller, ensure they can only update their own products
    if (req.user.role === UserRole.SELLER) {
      const product = await this.productsService.findOne(id);
      const productSellerId =
        (product as any).sellerId?._id?.toString() ||
        (product as any).sellerId?.toString();
      if (!productSellerId || productSellerId !== req.user.id) {
        throw new ForbiddenException('Access denied');
      }
    }

    const product = await this.productsService.update(id, dto);
    const lang = this.getLang(req);
    return formatResponse(
      product,
      await this.i18n.t('product.UPDATE_SUCCESS', { lang }),
    );
  }

  @Patch(':id/status')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Update product status',
    description: 'Update product active status (Admin only)',
  })
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiResponse({ status: 200, description: 'Product status updated successfully' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateProductStatusDto,
    @Req() req,
  ) {
    const product = await this.productsService.updateStatus(id, dto);
    const lang = this.getLang(req);
    return formatResponse(
      product,
      await this.i18n.t('product.STATUS_UPDATE_SUCCESS', { lang }),
    );
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.SELLER)
  @ApiOperation({
    summary: 'Delete product',
    description: 'Delete a product (Admin can delete any, Seller can only delete their own)',
  })
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiResponse({ status: 200, description: 'Product deleted successfully' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async remove(@Param('id') id: string, @Req() req) {
    // If seller, ensure they can only delete their own products
    if (req.user.role === UserRole.SELLER) {
      const product = await this.productsService.findOne(id);
      const productSellerId =
        (product as any).sellerId?._id?.toString() ||
        (product as any).sellerId?.toString();
      if (!productSellerId || productSellerId !== req.user.id) {
        throw new ForbiddenException('Access denied');
      }
    }

    await this.productsService.remove(id);
    const lang = this.getLang(req);
    return formatResponse(
      null,
      await this.i18n.t('product.DELETE_SUCCESS', { lang }),
    );
  }
}
