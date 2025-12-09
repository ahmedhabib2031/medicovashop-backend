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
import { CustomerAddressesService } from './customer-addresses.service';
import { CreateCustomerAddressDto } from './dto/create-customer-address.dto';
import { UpdateCustomerAddressDto } from './dto/update-customer-address.dto';
import { UpdateCustomerAddressStatusDto } from './dto/update-customer-address-status.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { I18nService } from 'nestjs-i18n';
import { formatResponse } from '../common/utils/response.util';

@ApiTags('Customer Addresses')
@ApiBearerAuth('JWT-auth')
@Controller('customer-addresses')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CustomerAddressesController {
  constructor(
    private readonly customerAddressesService: CustomerAddressesService,
    private readonly i18n: I18nService,
  ) {}

  private getLang(req: any) {
    return req.headers['accept-language']?.split(',')[0] || 'en';
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.USER)
  @ApiOperation({
    summary: 'Create customer address',
    description:
      'Create a new customer address. User ID is automatically extracted from token for users, or can be specified by admin.',
  })
  @ApiResponse({ status: 201, description: 'Address created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request data' })
  async create(@Body() dto: CreateCustomerAddressDto, @Req() req) {
    // If user is creating, automatically set userId from token
    if (req.user.role === UserRole.USER) {
      dto.userId = req.user.id;
    } else if (req.user.role === UserRole.ADMIN) {
      // Admin must provide userId
      if (!dto.userId) {
        throw new BadRequestException('User ID is required');
      }
    }

    try {
      const address = await this.customerAddressesService.create(dto);
      const lang = this.getLang(req);
      return formatResponse(
        address,
        await this.i18n.t('customerAddress.CREATE_SUCCESS', { lang }),
      );
    } catch (err) {
      const lang = this.getLang(req);
      throw new BadRequestException(
        formatResponse(
          null,
          await this.i18n.t('customerAddress.CREATE_FAILED', { lang }),
          'error',
        ),
      );
    }
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.USER)
  @ApiOperation({
    summary: 'Get all customer addresses',
    description:
      'Get all addresses with pagination and search (Admin sees all, User sees only their addresses)',
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Addresses fetched successfully' })
  async findAll(
    @Query('page') page,
    @Query('limit') limit,
    @Query('search') search,
    @Req() req,
  ) {
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;

    const query: any = { page: pageNum, limit: limitNum, search };

    // If user, only show their addresses
    if (req.user.role === UserRole.USER) {
      query.userId = req.user.id;
    }

    const result = await this.customerAddressesService.findAll(query);
    const totalPages = Math.ceil(result.total / limitNum);

    const lang = this.getLang(req);

    return formatResponse(
      {
        addresses: result.data,
        total: result.total,
        page: pageNum,
        limit: limitNum,
        next: pageNum < totalPages,
        previous: pageNum > 1,
      },
      await this.i18n.t('customerAddress.FETCH_SUCCESS', { lang }),
    );
  }

  @Get('me')
  @Roles(UserRole.USER)
  @ApiOperation({
    summary: 'Get customer own addresses',
    description: 'Get all addresses for the current customer (User only)',
  })
  @ApiResponse({ status: 200, description: 'Addresses fetched successfully' })
  async getMyAddresses(@Req() req) {
    const addresses = await this.customerAddressesService.findByUserId(
      req.user.id,
    );
    const lang = this.getLang(req);
    return formatResponse(
      addresses,
      await this.i18n.t('customerAddress.FETCH_SUCCESS', { lang }),
    );
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.USER)
  @ApiOperation({
    summary: 'Get customer address by ID',
    description:
      'Get a specific address by ID (Admin can access any, User can only access their own)',
  })
  @ApiParam({ name: 'id', description: 'Address ID' })
  @ApiResponse({ status: 200, description: 'Address fetched successfully' })
  @ApiResponse({ status: 404, description: 'Address not found' })
  async findOne(@Param('id') id: string, @Req() req) {
    const address = await this.customerAddressesService.findOne(id);

    // If user, ensure they can only access their own address
    if (req.user.role === UserRole.USER) {
      const addressUserId =
        (address as any).userId?._id?.toString() ||
        (address as any).userId?.toString();
      if (addressUserId !== req.user.id) {
        throw new ForbiddenException('Access denied');
      }
    }

    const lang = this.getLang(req);
    return formatResponse(
      address,
      await this.i18n.t('customerAddress.FETCH_SUCCESS', { lang }),
    );
  }

  @Put(':id')
  @Roles(UserRole.ADMIN, UserRole.USER)
  @ApiOperation({
    summary: 'Update customer address',
    description:
      'Update an address (Admin can update any, User can only update their own)',
  })
  @ApiParam({ name: 'id', description: 'Address ID' })
  @ApiResponse({ status: 200, description: 'Address updated successfully' })
  @ApiResponse({ status: 404, description: 'Address not found' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateCustomerAddressDto,
    @Req() req,
  ) {
    const userId =
      req.user.role === UserRole.USER ? req.user.id : undefined;
    const address = await this.customerAddressesService.update(
      id,
      dto,
      userId,
    );
    const lang = this.getLang(req);
    return formatResponse(
      address,
      await this.i18n.t('customerAddress.UPDATE_SUCCESS', { lang }),
    );
  }

  @Patch(':id/status')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Update address status',
    description: 'Update address active status (Admin only)',
  })
  @ApiParam({ name: 'id', description: 'Address ID' })
  @ApiResponse({
    status: 200,
    description: 'Address status updated successfully',
  })
  @ApiResponse({ status: 404, description: 'Address not found' })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateCustomerAddressStatusDto,
    @Req() req,
  ) {
    const address = await this.customerAddressesService.updateStatus(id, dto);
    const lang = this.getLang(req);
    return formatResponse(
      address,
      await this.i18n.t('customerAddress.STATUS_UPDATE_SUCCESS', { lang }),
    );
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.USER)
  @ApiOperation({
    summary: 'Delete customer address',
    description:
      'Delete an address (Admin can delete any, User can only delete their own)',
  })
  @ApiParam({ name: 'id', description: 'Address ID' })
  @ApiResponse({ status: 200, description: 'Address deleted successfully' })
  @ApiResponse({ status: 404, description: 'Address not found' })
  async remove(@Param('id') id: string, @Req() req) {
    const userId =
      req.user.role === UserRole.USER ? req.user.id : undefined;
    await this.customerAddressesService.remove(id, userId);
    const lang = this.getLang(req);
    return formatResponse(
      null,
      await this.i18n.t('customerAddress.DELETE_SUCCESS', { lang }),
    );
  }
}



