import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CartService } from './cart.service';
import { CreateCartDto } from './dto/create-cart.dto';
import { UpdateCartDto } from './dto/update-cart.dto';
import { AddItemToCartDto } from './dto/add-item-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
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
  ApiParam,
} from '@nestjs/swagger';

@ApiTags('Cart')
@Controller('cart')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class CartController {
  constructor(
    private readonly cartService: CartService,
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
  @Roles(UserRole.USER, UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new cart' })
  @ApiResponse({
    status: 201,
    description: 'Cart created successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async create(@Body() createCartDto: CreateCartDto, @Request() req) {
    const userId = req.user.id;
    const cart = await this.cartService.create(userId, createCartDto);
    const lang = this.getLang(req);
    return formatResponse(
      cart,
      await this.i18n.t('cart.CART_CREATED', { lang }),
    );
  }

  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all carts (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Carts retrieved successfully',
  })
  async findAll(@Request() req) {
    const userId = req.user.role === UserRole.ADMIN ? undefined : req.user.id;
    const carts = await this.cartService.findAll(userId);
    const lang = this.getLang(req);
    return formatResponse(
      carts,
      await this.i18n.t('cart.CARTS_RETRIEVED', { lang }),
    );
  }

  @Get('me')
  @Roles(UserRole.USER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get current user cart' })
  @ApiResponse({
    status: 200,
    description: 'Cart retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Cart not found' })
  async findMyCart(@Request() req) {
    const userId = req.user.id;
    const cart = await this.cartService.findOne(userId);
    const lang = this.getLang(req);
    return formatResponse(
      cart,
      await this.i18n.t('cart.CART_RETRIEVED', { lang }),
    );
  }

  @Get(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get cart by user ID (Admin only)' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({
    status: 200,
    description: 'Cart retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Cart not found' })
  async findOne(@Param('id') id: string, @Request() req) {
    const cart = await this.cartService.findOne(id);
    const lang = this.getLang(req);
    return formatResponse(
      cart,
      await this.i18n.t('cart.CART_RETRIEVED', { lang }),
    );
  }

  @Post('items')
  @Roles(UserRole.USER, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Add item to cart' })
  @ApiResponse({
    status: 200,
    description: 'Item added to cart successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Product or inventory not found' })
  async addItem(@Body() addItemDto: AddItemToCartDto, @Request() req) {
    const userId = req.user.id;
    const cart = await this.cartService.addItem(userId, addItemDto);
    const lang = this.getLang(req);
    return formatResponse(cart, await this.i18n.t('cart.ITEM_ADDED', { lang }));
  }

  @Patch('items/:itemId')
  @Roles(UserRole.USER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update cart item quantity' })
  @ApiParam({ name: 'itemId', description: 'Cart item ID' })
  @ApiResponse({
    status: 200,
    description: 'Cart item updated successfully',
  })
  @ApiResponse({ status: 404, description: 'Cart or item not found' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async updateItem(
    @Param('itemId') itemId: string,
    @Body() updateDto: UpdateCartItemDto,
    @Request() req,
  ) {
    const userId = req.user.id;
    const cart = await this.cartService.updateItem(userId, itemId, updateDto);
    const lang = this.getLang(req);
    return formatResponse(
      cart,
      await this.i18n.t('cart.ITEM_UPDATED', { lang }),
    );
  }

  @Delete('items/:itemId')
  @Roles(UserRole.USER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Remove item from cart' })
  @ApiParam({ name: 'itemId', description: 'Cart item ID' })
  @ApiResponse({
    status: 200,
    description: 'Item removed from cart successfully',
  })
  @ApiResponse({ status: 404, description: 'Cart or item not found' })
  async removeItem(@Param('itemId') itemId: string, @Request() req) {
    const userId = req.user.id;
    const cart = await this.cartService.removeItem(userId, itemId);
    const lang = this.getLang(req);
    return formatResponse(
      cart,
      await this.i18n.t('cart.ITEM_REMOVED', { lang }),
    );
  }

  @Patch()
  @Roles(UserRole.USER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update cart' })
  @ApiResponse({
    status: 200,
    description: 'Cart updated successfully',
  })
  @ApiResponse({ status: 404, description: 'Cart not found' })
  async update(@Body() updateCartDto: UpdateCartDto, @Request() req) {
    const userId = req.user.id;
    const cart = await this.cartService.update(userId, updateCartDto);
    const lang = this.getLang(req);
    return formatResponse(
      cart,
      await this.i18n.t('cart.CART_UPDATED', { lang }),
    );
  }

  @Delete('clear')
  @Roles(UserRole.USER, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Clear all items from cart' })
  @ApiResponse({
    status: 200,
    description: 'Cart cleared successfully',
  })
  @ApiResponse({ status: 404, description: 'Cart not found' })
  async clearCart(@Request() req) {
    const userId = req.user.id;
    const cart = await this.cartService.clearCart(userId);
    const lang = this.getLang(req);
    return formatResponse(
      cart,
      await this.i18n.t('cart.CART_CLEARED', { lang }),
    );
  }

  @Delete()
  @Roles(UserRole.USER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete cart' })
  @ApiResponse({
    status: 200,
    description: 'Cart deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'Cart not found' })
  async remove(@Request() req) {
    const userId = req.user.id;
    await this.cartService.remove(userId);
    const lang = this.getLang(req);
    return formatResponse(
      null,
      await this.i18n.t('cart.CART_DELETED', { lang }),
    );
  }
}
