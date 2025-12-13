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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { I18nService } from 'nestjs-i18n';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { OrderStatus } from './entities/order.entity';
import { formatResponse } from '../common/utils/response.util';

@ApiTags('Orders')
@Controller('orders')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class OrdersController {
  constructor(
    private readonly ordersService: OrdersService,
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
  @Roles(UserRole.USER)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new order' })
  @ApiResponse({
    status: 201,
    description: 'Order created successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Product or address not found' })
  async create(@Body() dto: CreateOrderDto, @Request() req) {
    const customerId = req.user.id || req.user.userId;
    const order = await this.ordersService.create(dto, customerId);
    const lang = this.getLang(req);
    return formatResponse(
      order,
      await this.i18n.t('orders.ORDER_CREATED', { lang }),
    );
  }

  @Get()
  @ApiOperation({ summary: 'Get all orders' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, enum: OrderStatus })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiResponse({
    status: 200,
    description: 'Orders retrieved successfully',
  })
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: OrderStatus,
    @Query('search') search?: string,
    @Request() req?,
  ) {
    const userId = req.user.id || req.user.userId;
    const userRole = req.user.role;

    let customerId: string | undefined;
    let sellerId: string | undefined;

    if (userRole === UserRole.USER) {
      customerId = userId;
    } else if (userRole === UserRole.SELLER) {
      sellerId = userId;
    }
    // ADMIN can see all orders (no filter)

    const result = await this.ordersService.findAll(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 10,
      status,
      customerId,
      sellerId,
      search,
    );
    const lang = this.getLang(req);
    return formatResponse(
      result,
      await this.i18n.t('orders.ORDERS_RETRIEVED', { lang }),
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order by ID' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiResponse({
    status: 200,
    description: 'Order retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Order not found' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  async findOne(@Param('id') id: string, @Request() req) {
    const userId = req.user.id || req.user.userId;
    const userRole = req.user.role;

    let customerId: string | undefined;
    let sellerId: string | undefined;

    if (userRole === UserRole.USER) {
      customerId = userId;
    } else if (userRole === UserRole.SELLER) {
      sellerId = userId;
    }

    const order = await this.ordersService.findOne(id, customerId, sellerId);
    const lang = this.getLang(req);
    return formatResponse(
      order,
      await this.i18n.t('orders.ORDER_RETRIEVED', { lang }),
    );
  }

  @Patch(':id')
  @Roles(UserRole.USER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update order' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiResponse({
    status: 200,
    description: 'Order updated successfully',
  })
  @ApiResponse({ status: 404, description: 'Order not found' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateOrderDto,
    @Request() req,
  ) {
    const userId = req.user.id || req.user.userId;
    const userRole = req.user.role;

    const customerId = userRole === UserRole.USER ? userId : undefined;
    const order = await this.ordersService.update(id, dto, customerId);
    const lang = this.getLang(req);
    return formatResponse(
      order,
      await this.i18n.t('orders.ORDER_UPDATED', { lang }),
    );
  }

  @Patch(':id/status')
  @Roles(UserRole.ADMIN, UserRole.SELLER)
  @ApiOperation({ summary: 'Update order status' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiResponse({
    status: 200,
    description: 'Order status updated successfully',
  })
  @ApiResponse({ status: 404, description: 'Order not found' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
    @Request() req,
  ) {
    const userId = req.user.id || req.user.userId;
    const userRole = req.user.role;

    const sellerId = userRole === UserRole.SELLER ? userId : undefined;
    const order = await this.ordersService.updateStatus(id, dto, sellerId);
    const lang = this.getLang(req);
    return formatResponse(
      order,
      await this.i18n.t('orders.ORDER_STATUS_UPDATED', { lang }),
    );
  }

  @Delete(':id')
  @Roles(UserRole.USER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Cancel/Delete order' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiResponse({
    status: 200,
    description: 'Order cancelled/deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'Order not found' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  async remove(@Param('id') id: string, @Request() req) {
    const userId = req.user.id || req.user.userId;
    const userRole = req.user.role;

    const customerId = userRole === UserRole.USER ? userId : undefined;
    await this.ordersService.remove(id, customerId);
    const lang = this.getLang(req);
    return formatResponse(
      null,
      await this.i18n.t('orders.ORDER_DELETED', { lang }),
    );
  }

  @Get('customer/my-orders')
  @Roles(UserRole.USER)
  @ApiOperation({ summary: 'Get current user orders' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, enum: OrderStatus })
  @ApiResponse({
    status: 200,
    description: 'User orders retrieved successfully',
  })
  async getMyOrders(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: OrderStatus,
    @Request() req?,
  ) {
    const customerId = req.user.id || req.user.userId;
    const result = await this.ordersService.findAll(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 10,
      status,
      customerId,
    );
    const lang = this.getLang(req);
    return formatResponse(
      result,
      await this.i18n.t('orders.ORDERS_RETRIEVED', { lang }),
    );
  }

  @Get('seller/my-orders')
  @Roles(UserRole.SELLER)
  @ApiOperation({ summary: 'Get seller orders (orders containing seller products)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, enum: OrderStatus })
  @ApiResponse({
    status: 200,
    description: 'Seller orders retrieved successfully',
  })
  async getSellerOrders(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: OrderStatus,
    @Request() req?,
  ) {
    const sellerId = req.user.id || req.user.userId;
    const result = await this.ordersService.findAll(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 10,
      status,
      undefined,
      sellerId,
    );
    const lang = this.getLang(req);
    return formatResponse(
      result,
      await this.i18n.t('orders.ORDERS_RETRIEVED', { lang }),
    );
  }
}
