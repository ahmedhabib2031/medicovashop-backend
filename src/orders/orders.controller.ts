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
import {
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
} from './entities/order.entity';
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
  @ApiQuery({
    name: 'timeFilter',
    required: false,
    enum: ['all', 'last_3_months'],
    description:
      'Filter orders by time: "all" for all orders, "last_3_months" for orders from last 3 months',
  })
  @ApiQuery({
    name: 'categoryId',
    required: false,
    type: String,
    description: 'Filter by product category ID (MongoDB ObjectId)',
  })
  @ApiQuery({
    name: 'brandId',
    required: false,
    type: String,
    description: 'Filter by product brand ID (MongoDB ObjectId)',
  })
  @ApiQuery({
    name: 'customerId',
    required: false,
    type: String,
    description: 'Filter by customer ID (MongoDB ObjectId). Admin only.',
  })
  @ApiQuery({
    name: 'sellerId',
    required: false,
    type: String,
    description: 'Filter by seller ID (MongoDB ObjectId). Admin only.',
  })
  @ApiQuery({
    name: 'paymentStatus',
    required: false,
    enum: PaymentStatus,
    description: 'Filter by payment status',
  })
  @ApiQuery({
    name: 'paymentMethod',
    required: false,
    enum: PaymentMethod,
    description: 'Filter by payment method',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: String,
    description: 'Filter orders created on or after this date (ISO format: YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: String,
    description: 'Filter orders created on or before this date (ISO format: YYYY-MM-DD)',
  })
  @ApiResponse({
    status: 200,
    description: 'Orders retrieved successfully',
  })
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: OrderStatus,
    @Query('search') search?: string,
    @Query('timeFilter') timeFilter?: string,
    @Query('categoryId') categoryId?: string,
    @Query('brandId') brandId?: string,
    @Query('customerId') customerId?: string,
    @Query('sellerId') sellerId?: string,
    @Query('paymentStatus') paymentStatus?: PaymentStatus,
    @Query('paymentMethod') paymentMethod?: PaymentMethod,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Request() req?,
  ) {
    const userId = req.user.id || req.user.userId;
    const userRole = req.user.role;

    let finalCustomerId: string | undefined;
    let finalSellerId: string | undefined;

    // Handle customerId filter
    if (userRole === UserRole.USER) {
      // Users can only see their own orders
      finalCustomerId = userId;
    } else if (userRole === UserRole.ADMIN && customerId) {
      // Admins can filter by any customerId
      finalCustomerId = customerId;
    }

    // Handle sellerId filter
    if (userRole === UserRole.SELLER) {
      // Sellers can only see orders with their products
      finalSellerId = userId;
    } else if (userRole === UserRole.ADMIN && sellerId) {
      // Admins can filter by any sellerId
      finalSellerId = sellerId;
    }

    const result = await this.ordersService.findAll(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 10,
      status,
      finalCustomerId,
      finalSellerId,
      search,
      timeFilter,
      categoryId,
      brandId,
      paymentStatus,
      paymentMethod,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
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
  @ApiQuery({
    name: 'timeFilter',
    required: false,
    enum: ['all', 'last_3_months'],
    description:
      'Filter orders by time: "all" for all orders, "last_3_months" for orders from last 3 months',
  })
  @ApiResponse({
    status: 200,
    description: 'User orders retrieved successfully',
  })
  async getMyOrders(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: OrderStatus,
    @Query('timeFilter') timeFilter?: string,
    @Request() req?,
  ) {
    const customerId = req.user.id || req.user.userId;
    const result = await this.ordersService.findAll(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 10,
      status,
      customerId,
      undefined,
      undefined,
      timeFilter,
    );
    const lang = this.getLang(req);
    return formatResponse(
      result,
      await this.i18n.t('orders.ORDERS_RETRIEVED', { lang }),
    );
  }

  @Get('seller/my-orders')
  @Roles(UserRole.SELLER)
  @ApiOperation({
    summary: 'Get seller orders (orders containing seller products)',
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, enum: OrderStatus })
  @ApiQuery({
    name: 'timeFilter',
    required: false,
    enum: ['all', 'last_3_months'],
    description:
      'Filter orders by time: "all" for all orders, "last_3_months" for orders from last 3 months',
  })
  @ApiResponse({
    status: 200,
    description: 'Seller orders retrieved successfully',
  })
  async getSellerOrders(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: OrderStatus,
    @Query('timeFilter') timeFilter?: string,
    @Request() req?,
  ) {
    const sellerId = req.user.id || req.user.userId;
    const result = await this.ordersService.findAll(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 10,
      status,
      undefined,
      sellerId,
      undefined,
      timeFilter,
    );
    const lang = this.getLang(req);
    return formatResponse(
      result,
      await this.i18n.t('orders.ORDERS_RETRIEVED', { lang }),
    );
  }
}
