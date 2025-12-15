import {
  Controller, Get, Post, Put, Delete, Body, Param, Req, Query,
  BadRequestException, UseGuards,
  Patch
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiParam } from '@nestjs/swagger';
import { BrandService } from './brands.service';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto, UpdateBrandStatusDto } from './dto/update-brand.dto';
import { JwtAuthGuard } from 'src/auth/guards';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/roles.decorator';
import { UserRole } from 'src/users/entities/user.entity';
import { I18nService } from 'nestjs-i18n';
import { formatResponse } from 'src/common/utils/response.util';

@ApiTags('Brands')
@ApiBearerAuth('JWT-auth')
@Controller('brands')
export class BrandController {
  constructor(
    private readonly brandService: BrandService,
    private readonly i18n: I18nService,
  ) {}

  private getLang(req: any) {
    return req.headers['accept-language']?.split(',')[0] || 'en';
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async create(@Body() dto: CreateBrandDto, @Req() req) {
    try {
      const brand = await this.brandService.create(dto);
      const lang = this.getLang(req);
      return formatResponse(brand, await this.i18n.t('brand.CREATE_SUCCESS', { lang }));
    } catch (err) {
      const lang = this.getLang(req);
      throw new BadRequestException(
        formatResponse(null, await this.i18n.t('brand.CREATE_FAILED', { lang }), 'error')
      );
    }
  }

  @Get()
  async findAll(@Query('page') page, @Query('limit') limit, @Query('search') search, @Req() req) {
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;

    const result = await this.brandService.findAll({ page: pageNum, limit: limitNum, search });
    const totalPages = Math.ceil(result.total / limitNum);

    const lang = this.getLang(req);

    return formatResponse(
      {
        brands: result.data,
        total: result.total,
        page: pageNum,
        limit: limitNum,
        next: pageNum < totalPages,
        previous: pageNum > 1,
      },
      await this.i18n.t('brand.FETCH_SUCCESS', { lang })
    );
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req) {
    const brand = await this.brandService.findOne(id);
    const lang = this.getLang(req);
    return formatResponse(brand, await this.i18n.t('brand.FETCH_SUCCESS', { lang }));
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async update(@Param('id') id: string, @Body() dto: UpdateBrandDto, @Req() req) {
    const brand = await this.brandService.update(id, dto);
    const lang = this.getLang(req);
    return formatResponse(brand, await this.i18n.t('brand.UPDATE_SUCCESS', { lang }));
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async remove(@Param('id') id: string, @Req() req) {
    await this.brandService.remove(id);
    const lang = this.getLang(req);
    return formatResponse(null, await this.i18n.t('brand.DELETE_SUCCESS', { lang }));
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateBrandStatusDto,
    @Req() req
  ) {
    const brand = await this.brandService.updateStatus(id, dto);
    const lang = this.getLang(req);

    return formatResponse(
      brand,
      await this.i18n.t('brand.STATUS_UPDATE_SUCCESS', { lang })
    );
  }
}