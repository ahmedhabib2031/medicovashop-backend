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
import { SellerStoreService } from './seller-store.service';
import { CreateSellerStoreDto } from './dto/create-seller-store.dto';
import { UpdateSellerStoreDto } from './dto/update-seller-store.dto';
import { UpdateSellerStoreStatusDto } from './dto/update-seller-store-status.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { I18nService } from 'nestjs-i18n';
import { formatResponse } from '../common/utils/response.util';

@ApiTags('Seller Store')
@ApiBearerAuth('JWT-auth')
@Controller('seller-store')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SellerStoreController {
  constructor(
    private readonly sellerStoreService: SellerStoreService,
    private readonly i18n: I18nService,
  ) {}

  private getLang(req: any) {
    return req.headers['accept-language']?.split(',')[0] || 'en';
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.SELLER)
  @ApiOperation({
    summary: 'Create seller store',
    description: 'Create a new seller store. Seller ID is automatically extracted from token for sellers, or can be specified by admin.',
  })
  @ApiResponse({ status: 201, description: 'Store created successfully' })
  @ApiResponse({ status: 400, description: 'Store already exists for this seller' })
  async create(@Body() dto: CreateSellerStoreDto, @Req() req) {
    // If seller is creating, automatically set sellerId from token
    if (req.user.role === UserRole.SELLER) {
      dto.sellerId = req.user.id || req.user.userId;
    } else if (req.user.role === UserRole.ADMIN) {
      // Admin must provide sellerId
      if (!dto.sellerId) {
        const lang = this.getLang(req);
        throw new BadRequestException(
          formatResponse(
            null,
            await this.i18n.t('sellerStore.SELLER_ID_REQUIRED', { lang }),
            'error',
          ),
        );
      }
    }

    try {
      const store = await this.sellerStoreService.create(dto);
      const lang = this.getLang(req);
      return formatResponse(
        store,
        await this.i18n.t('sellerStore.CREATE_SUCCESS', { lang }),
      );
    } catch (err) {
      const lang = this.getLang(req);
      
      // Get the error message
      let errorMessage = err?.message || '';
      
      // If it's a BadRequestException, try to extract message from response
      if (err instanceof BadRequestException) {
        const errorResponse = err.getResponse();
        if (typeof errorResponse === 'string') {
          errorMessage = errorResponse;
        } else if (errorResponse && typeof errorResponse === 'object') {
          errorMessage = (errorResponse as any).message || errorMessage;
        }
      }
      
      // If it's the store exists error, return a specific message
      if (errorMessage === 'SELLER_STORE_EXISTS' || 
          (typeof errorMessage === 'string' && errorMessage.includes('SELLER_STORE_EXISTS'))) {
        const translatedMessage = await this.i18n.t('sellerStore.SELLER_STORE_EXISTS', { lang });
        // Fallback to English if translation returns the key
        const message = translatedMessage === 'sellerStore.SELLER_STORE_EXISTS' 
          ? 'Store already exists for this seller' 
          : translatedMessage;
        throw new BadRequestException(
          formatResponse(
            null,
            message,
            'error',
          ),
        );
      }
      
      // Return the error message or generic failure message
      const translatedMessage = errorMessage || await this.i18n.t('sellerStore.CREATE_FAILED', { lang });
      const message = translatedMessage === 'sellerStore.CREATE_FAILED'
        ? 'Failed to create seller store'
        : translatedMessage;
      throw new BadRequestException(
        formatResponse(
          null,
          message,
          'error',
        ),
      );
    }
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.SELLER)
  @ApiOperation({
    summary: 'Get all seller stores',
    description: 'Get all stores with pagination and search (Admin sees all, Seller sees only their store)',
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Stores fetched successfully' })
  async findAll(
    @Query('page') page,
    @Query('limit') limit,
    @Query('search') search,
    @Req() req,
  ) {
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;

    const query: any = { page: pageNum, limit: limitNum, search };

    // If seller, only show their stores
    if (req.user.role === UserRole.SELLER) {
      query.sellerId = req.user.id;
    }

    const result = await this.sellerStoreService.findAll(query);
    const totalPages = Math.ceil(result.total / limitNum);

    const lang = this.getLang(req);

    return formatResponse(
      {
        stores: result.data,
        total: result.total,
        page: pageNum,
        limit: limitNum,
        next: pageNum < totalPages,
        previous: pageNum > 1,
      },
      await this.i18n.t('sellerStore.FETCH_SUCCESS', { lang }),
    );
  }

  @Get('me')
  @Roles(UserRole.SELLER)
  @ApiOperation({
    summary: 'Get seller own stores',
    description: 'Get all stores for the current seller (Seller only)',
  })
  @ApiResponse({ status: 200, description: 'Stores fetched successfully' })
  async getMyStore(@Req() req) {
    const stores = await this.sellerStoreService.findBySellerId(req.user.id);
    const lang = this.getLang(req);
    return formatResponse(
      stores,
      await this.i18n.t('sellerStore.FETCH_SUCCESS', { lang }),
    );
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.SELLER)
  @ApiOperation({
    summary: 'Get seller store by ID',
    description: 'Get a specific store by ID (Admin can access any, Seller can only access their own)',
  })
  @ApiParam({ name: 'id', description: 'Store ID' })
  @ApiResponse({ status: 200, description: 'Store fetched successfully' })
  @ApiResponse({ status: 404, description: 'Store not found' })
  async findOne(@Param('id') id: string, @Req() req) {
    const store = await this.sellerStoreService.findOne(id);

    // If seller, ensure they can only access their own store
    if (req.user.role === UserRole.SELLER) {
      const storeSellerId = (store as any).sellerId?._id?.toString() || (store as any).sellerId?.toString();
      if (storeSellerId !== req.user.id) {
        throw new ForbiddenException('Access denied');
      }
    }

    const lang = this.getLang(req);
    return formatResponse(
      store,
      await this.i18n.t('sellerStore.FETCH_SUCCESS', { lang }),
    );
  }

  @Put(':id')
  @Roles(UserRole.ADMIN, UserRole.SELLER)
  @ApiOperation({
    summary: 'Update seller store',
    description: 'Update a store (Admin can update any, Seller can only update their own)',
  })
  @ApiParam({ name: 'id', description: 'Store ID' })
  @ApiResponse({ status: 200, description: 'Store updated successfully' })
  @ApiResponse({ status: 404, description: 'Store not found' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateSellerStoreDto,
    @Req() req,
  ) {
    // If seller, ensure they can only update their own store
    if (req.user.role === UserRole.SELLER) {
      const store = await this.sellerStoreService.findOne(id);
      const storeSellerId = (store as any).sellerId?._id?.toString() || (store as any).sellerId?.toString();
      if (storeSellerId !== req.user.id) {
        throw new ForbiddenException('Access denied');
      }
      // Remove sellerId from update if seller is trying to change it
      delete dto.sellerId;
    }

    const store = await this.sellerStoreService.update(id, dto);
    const lang = this.getLang(req);
    return formatResponse(
      store,
      await this.i18n.t('sellerStore.UPDATE_SUCCESS', { lang }),
    );
  }

  @Put('me')
  @Roles(UserRole.SELLER)
  @ApiOperation({
    summary: 'Update seller own store',
    description: 'Update the current seller\'s store (Seller only)',
  })
  @ApiResponse({ status: 200, description: 'Store updated successfully' })
  @ApiResponse({ status: 404, description: 'Store not found' })
  async updateMyStore(@Body() dto: UpdateSellerStoreDto, @Req() req) {
    const store = await this.sellerStoreService.findBySellerId(req.user.id);
    if (!store) {
      const lang = this.getLang(req);
      throw new BadRequestException(
        formatResponse(
          null,
          await this.i18n.t('sellerStore.STORE_NOT_FOUND', { lang }),
          'error',
        ),
      );
    }

    // Remove sellerId from update
    delete dto.sellerId;

    const updatedStore = await this.sellerStoreService.update(
      (store as any)._id.toString(),
      dto,
    );
    const lang = this.getLang(req);
    return formatResponse(
      updatedStore,
      await this.i18n.t('sellerStore.UPDATE_SUCCESS', { lang }),
    );
  }

  @Patch(':id/status')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Update store status',
    description: 'Update store active status (Admin only)',
  })
  @ApiParam({ name: 'id', description: 'Store ID' })
  @ApiResponse({ status: 200, description: 'Store status updated successfully' })
  @ApiResponse({ status: 404, description: 'Store not found' })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateSellerStoreStatusDto,
    @Req() req,
  ) {
    const store = await this.sellerStoreService.updateStatus(id, dto);
    const lang = this.getLang(req);
    return formatResponse(
      store,
      await this.i18n.t('sellerStore.STATUS_UPDATE_SUCCESS', { lang }),
    );
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Delete seller store',
    description: 'Delete a store (Admin only)',
  })
  @ApiParam({ name: 'id', description: 'Store ID' })
  @ApiResponse({ status: 200, description: 'Store deleted successfully' })
  @ApiResponse({ status: 404, description: 'Store not found' })
  async remove(@Param('id') id: string, @Req() req) {
    await this.sellerStoreService.remove(id);
    const lang = this.getLang(req);
    return formatResponse(
      null,
      await this.i18n.t('sellerStore.DELETE_SUCCESS', { lang }),
    );
  }
}

