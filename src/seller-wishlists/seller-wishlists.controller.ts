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
import { SellerWishlistsService } from './seller-wishlists.service';
import { AddProductToWishlistDto } from './dto/add-product-to-wishlist.dto';
import { RemoveProductFromWishlistDto } from './dto/remove-product-from-wishlist.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { I18nService } from 'nestjs-i18n';
import { formatResponse } from '../common/utils/response.util';

@ApiTags('Seller Wishlists')
@ApiBearerAuth('JWT-auth')
@Controller('seller-wishlists')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SellerWishlistsController {
  constructor(
    private readonly sellerWishlistsService: SellerWishlistsService,
    private readonly i18n: I18nService,
  ) {}

  private getLang(req: any) {
    return req.headers['accept-language']?.split(',')[0] || 'en';
  }

  @Get('me')
  @Roles(UserRole.SELLER)
  @ApiOperation({
    summary: 'Get seller own wishlist',
    description: 'Get the current seller\'s wishlist (Seller only). Creates wishlist if it doesn\'t exist.',
  })
  @ApiResponse({ status: 200, description: 'Wishlist fetched successfully' })
  async getMyWishlist(@Req() req) {
    const wishlist = await this.sellerWishlistsService.findBySellerId(
      req.user.id,
    );
    const lang = this.getLang(req);
    return formatResponse(
      wishlist,
      await this.i18n.t('sellerWishlist.FETCH_SUCCESS', { lang }),
    );
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.SELLER)
  @ApiOperation({
    summary: 'Get all seller wishlists',
    description:
      'Get all wishlists with pagination (Admin sees all, Seller sees only their wishlist)',
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Wishlists fetched successfully' })
  async findAll(
    @Query('page') page,
    @Query('limit') limit,
    @Req() req,
  ) {
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;

    const query: any = { page: pageNum, limit: limitNum };

    // If seller, only show their wishlist
    if (req.user.role === UserRole.SELLER) {
      query.sellerId = req.user.id;
    }

    const result = await this.sellerWishlistsService.findAll(query);
    const totalPages = Math.ceil(result.total / limitNum);

    const lang = this.getLang(req);

    return formatResponse(
      {
        wishlists: result.data,
        total: result.total,
        page: pageNum,
        limit: limitNum,
        next: pageNum < totalPages,
        previous: pageNum > 1,
      },
      await this.i18n.t('sellerWishlist.FETCH_SUCCESS', { lang }),
    );
  }

  @Get('seller/:sellerId')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Get wishlist by seller ID',
    description: 'Get a specific seller\'s wishlist by seller ID (Admin only)',
  })
  @ApiParam({ name: 'sellerId', description: 'Seller ID' })
  @ApiResponse({ status: 200, description: 'Wishlist fetched successfully' })
  async getBySellerId(@Param('sellerId') sellerId: string, @Req() req) {
    const wishlist = await this.sellerWishlistsService.findBySellerId(sellerId);
    const lang = this.getLang(req);
    return formatResponse(
      wishlist,
      await this.i18n.t('sellerWishlist.FETCH_SUCCESS', { lang }),
    );
  }

  @Post('me/products')
  @Roles(UserRole.SELLER)
  @ApiOperation({
    summary: 'Add products to wishlist',
    description: 'Add products to the current seller\'s wishlist (Seller only)',
  })
  @ApiResponse({ status: 200, description: 'Products added to wishlist successfully' })
  @ApiResponse({ status: 400, description: 'All products are already in the wishlist' })
  async addProducts(@Body() dto: AddProductToWishlistDto, @Req() req) {
    try {
      const wishlist = await this.sellerWishlistsService.addProducts(
        req.user.id,
        dto,
      );
      const lang = this.getLang(req);
      return formatResponse(
        wishlist,
        await this.i18n.t('sellerWishlist.ADD_PRODUCTS_SUCCESS', { lang }),
      );
    } catch (err) {
      const lang = this.getLang(req);
      throw new BadRequestException(
        formatResponse(
          null,
          await this.i18n.t('sellerWishlist.ADD_PRODUCTS_FAILED', { lang }),
          'error',
        ),
      );
    }
  }

  @Put('me/products')
  @Roles(UserRole.SELLER)
  @ApiOperation({
    summary: 'Remove products from wishlist',
    description: 'Remove products from the current seller\'s wishlist (Seller only)',
  })
  @ApiResponse({ status: 200, description: 'Products removed from wishlist successfully' })
  @ApiResponse({ status: 404, description: 'Wishlist not found' })
  async removeProducts(@Body() dto: RemoveProductFromWishlistDto, @Req() req) {
    const wishlist = await this.sellerWishlistsService.removeProducts(
      req.user.id,
      dto,
    );
    const lang = this.getLang(req);
    return formatResponse(
      wishlist,
      await this.i18n.t('sellerWishlist.REMOVE_PRODUCTS_SUCCESS', { lang }),
    );
  }

  @Delete('me/clear')
  @Roles(UserRole.SELLER)
  @ApiOperation({
    summary: 'Clear wishlist',
    description: 'Remove all products from the current seller\'s wishlist (Seller only)',
  })
  @ApiResponse({ status: 200, description: 'Wishlist cleared successfully' })
  @ApiResponse({ status: 404, description: 'Wishlist not found' })
  async clearWishlist(@Req() req) {
    const wishlist = await this.sellerWishlistsService.clearWishlist(
      req.user.id,
    );
    const lang = this.getLang(req);
    return formatResponse(
      wishlist,
      await this.i18n.t('sellerWishlist.CLEAR_SUCCESS', { lang }),
    );
  }

  @Delete('seller/:sellerId')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Delete seller wishlist',
    description: 'Delete a seller\'s wishlist (Admin only)',
  })
  @ApiParam({ name: 'sellerId', description: 'Seller ID' })
  @ApiResponse({ status: 200, description: 'Wishlist deleted successfully' })
  @ApiResponse({ status: 404, description: 'Wishlist not found' })
  async remove(@Param('sellerId') sellerId: string, @Req() req) {
    await this.sellerWishlistsService.remove(sellerId);
    const lang = this.getLang(req);
    return formatResponse(
      null,
      await this.i18n.t('sellerWishlist.DELETE_SUCCESS', { lang }),
    );
  }
}



