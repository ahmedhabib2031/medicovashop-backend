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
import { ProductCollectionService } from './product-collection.service';
import { CreateProductCollectionDto } from './dto/create-product-collection.dto';
import { UpdateProductCollectionDto } from './dto/update-product-collection.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { I18nService } from 'nestjs-i18n';
import { formatResponse } from '../common/utils/response.util';

@ApiTags('Product Collections')
@ApiBearerAuth('JWT-auth')
@Controller('product-collections')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProductCollectionController {
  constructor(
    private readonly productCollectionService: ProductCollectionService,
    private readonly i18n: I18nService,
  ) {}

  private getLang(req: any) {
    return req.headers['accept-language']?.split(',')[0] || 'en';
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.SELLER)
  @ApiOperation({
    summary: 'Create product collection',
    description:
      'Create a new product collection. Seller ID is automatically extracted from token for sellers, or can be specified by admin.',
  })
  @ApiResponse({ status: 201, description: 'Collection created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request data' })
  async create(
    @Body() dto: CreateProductCollectionDto,
    @Req() req,
  ) {
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
      const collection =
        await this.productCollectionService.create(dto);
      const lang = this.getLang(req);
      return formatResponse(
        collection,
        await this.i18n.t('productCollection.CREATE_SUCCESS', { lang }),
      );
    } catch (err) {
      const lang = this.getLang(req);
      throw new BadRequestException(
        formatResponse(
          null,
          await this.i18n.t('productCollection.CREATE_FAILED', { lang }),
          'error',
        ),
      );
    }
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.SELLER)
  @ApiOperation({
    summary: 'Get all product collections',
    description:
      'Get all collections with pagination, search, and filters (Admin sees all, Seller sees only their collections)',
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: Boolean })
  @ApiQuery({ name: 'isFeatures', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: 'Collections fetched successfully' })
  async findAll(
    @Query('page') page,
    @Query('limit') limit,
    @Query('search') search,
    @Query('status') status,
    @Query('isFeatures') isFeatures,
    @Req() req,
  ) {
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;

    const query: any = { page: pageNum, limit: limitNum, search };
    if (status !== undefined) {
      query.status = status === 'true';
    }
    if (isFeatures !== undefined) {
      query.isFeatures = isFeatures === 'true';
    }

    // If seller, only show their collections
    if (req.user.role === UserRole.SELLER) {
      query.sellerId = req.user.id;
    }

    const result = await this.productCollectionService.findAll(query);
    const totalPages = Math.ceil(result.total / limitNum);

    const lang = this.getLang(req);

    return formatResponse(
      {
        collections: result.data,
        total: result.total,
        page: pageNum,
        limit: limitNum,
        next: pageNum < totalPages,
        previous: pageNum > 1,
      },
      await this.i18n.t('productCollection.FETCH_SUCCESS', { lang }),
    );
  }

  @Get('me')
  @Roles(UserRole.SELLER)
  @ApiOperation({
    summary: 'Get seller own collections',
    description:
      'Get all collections for the current seller with pagination, search, and optional filters (Seller only)',
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: Boolean })
  @ApiQuery({ name: 'isFeatures', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: 'Collections fetched successfully' })
  async getMyCollections(
    @Query('page') page,
    @Query('limit') limit,
    @Query('search') search,
    @Query('status') status,
    @Query('isFeatures') isFeatures,
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

    if (status !== undefined) {
      query.status = status === 'true';
    }
    if (isFeatures !== undefined) {
      query.isFeatures = isFeatures === 'true';
    }

    const result = await this.productCollectionService.findAll(query);
    const totalPages = Math.ceil(result.total / limitNum);

    const lang = this.getLang(req);
    return formatResponse(
      {
        collections: result.data,
        total: result.total,
        page: pageNum,
        limit: limitNum,
        next: pageNum < totalPages,
        previous: pageNum > 1,
      },
      await this.i18n.t('productCollection.FETCH_SUCCESS', { lang }),
    );
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.SELLER)
  @ApiOperation({
    summary: 'Get product collection by ID',
    description:
      'Get a specific collection by ID (Admin can access any, Seller can only access their own)',
  })
  @ApiParam({ name: 'id', description: 'Collection ID' })
  @ApiResponse({ status: 200, description: 'Collection fetched successfully' })
  @ApiResponse({ status: 404, description: 'Collection not found' })
  async findOne(@Param('id') id: string, @Req() req) {
    const collection = await this.productCollectionService.findOne(id);

    // If seller, ensure they can only access their own collection
    if (req.user.role === UserRole.SELLER) {
      const collectionSellerId =
        (collection as any).sellerId?._id?.toString() ||
        (collection as any).sellerId?.toString();
      if (collectionSellerId !== req.user.id) {
        throw new ForbiddenException('Access denied');
      }
    }

    const lang = this.getLang(req);
    return formatResponse(
      collection,
      await this.i18n.t('productCollection.FETCH_SUCCESS', { lang }),
    );
  }

  @Put(':id')
  @Roles(UserRole.ADMIN, UserRole.SELLER)
  @ApiOperation({
    summary: 'Update product collection',
    description:
      'Update a collection (Admin can update any, Seller can only update their own)',
  })
  @ApiParam({ name: 'id', description: 'Collection ID' })
  @ApiResponse({ status: 200, description: 'Collection updated successfully' })
  @ApiResponse({ status: 404, description: 'Collection not found' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateProductCollectionDto,
    @Req() req,
  ) {
    const sellerId =
      req.user.role === UserRole.SELLER ? req.user.id : undefined;
    const collection = await this.productCollectionService.update(
      id,
      dto,
      sellerId,
    );
    const lang = this.getLang(req);
    return formatResponse(
      collection,
      await this.i18n.t('productCollection.UPDATE_SUCCESS', { lang }),
    );
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.SELLER)
  @ApiOperation({
    summary: 'Delete product collection',
    description:
      'Delete a collection (Admin can delete any, Seller can only delete their own)',
  })
  @ApiParam({ name: 'id', description: 'Collection ID' })
  @ApiResponse({ status: 200, description: 'Collection deleted successfully' })
  @ApiResponse({ status: 404, description: 'Collection not found' })
  async remove(@Param('id') id: string, @Req() req) {
    const sellerId =
      req.user.role === UserRole.SELLER ? req.user.id : undefined;
    await this.productCollectionService.remove(id, sellerId);
    const lang = this.getLang(req);
    return formatResponse(
      null,
      await this.i18n.t('productCollection.DELETE_SUCCESS', { lang }),
    );
  }

  @Delete()
  @Roles(UserRole.ADMIN, UserRole.SELLER)
  @ApiOperation({
    summary: 'Bulk delete product collections',
    description:
      'Delete multiple collections at once. Admin can delete any, Seller can only delete their own collections.',
  })
  @ApiQuery({
    name: 'ids',
    required: true,
    type: String,
    description:
      'Comma-separated list of collection IDs to delete (e.g. id1,id2,id3)',
  })
  @ApiResponse({
    status: 200,
    description: 'Collections deleted successfully',
  })
  async bulkRemove(@Query('ids') ids: string, @Req() req) {
    const idList = ids
      ?.split(',')
      .map((id) => id.trim())
      .filter(Boolean);

    if (!idList.length) {
      throw new BadRequestException('No collection IDs provided');
    }

    const sellerId =
      req.user.role === UserRole.SELLER ? req.user.id : undefined;

    const result = await this.productCollectionService.removeMany(
      idList,
      sellerId,
    );

    const lang = this.getLang(req);
    return formatResponse(
      {
        deletedCount: result.deletedCount,
        ids: idList,
      },
      await this.i18n.t('productCollection.DELETE_SUCCESS', { lang }),
    );
  }
}


