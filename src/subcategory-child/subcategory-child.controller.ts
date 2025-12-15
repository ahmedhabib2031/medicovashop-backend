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
  UseGuards,
  BadRequestException,
  Patch,
} from '@nestjs/common';
import { SubcategoryChildService } from './subcategory-child.service';
import {
  CreateSubcategoryChildDto,
  UpdateSubcategoryChildDto,
  UpdateSubcategoryChildStatusDto,
} from './dto/subcategory-child.dto';
import { I18nService } from 'nestjs-i18n';
import { JwtAuthGuard } from 'src/auth/guards';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/roles.decorator';
import { UserRole } from 'src/users/entities/user.entity';
import { formatResponse } from 'src/common/utils/response.util';

@Controller('subcategory-child')
export class SubcategoryChildController {
  constructor(
    private readonly subcategoryChildService: SubcategoryChildService,
    private readonly i18n: I18nService,
  ) {}

  private getLang(req: any) {
    return req.headers['accept-language']?.split(',')[0] || 'en';
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async create(@Body() dto: CreateSubcategoryChildDto, @Req() req) {
    try {
      const child = await this.subcategoryChildService.create(dto);
      const lang = this.getLang(req);
      return formatResponse(child, await this.i18n.t('subcategoryChild.CREATE_SUCCESS', { lang }));
    } catch (err) {
      const lang = this.getLang(req);
      let messageKey = 'subcategoryChild.CREATE_FAILED';
      if (err.response?.message === 'SUBCATEGORY_CHILD_SLUG_ALREADY_EXISTS') {
        messageKey = 'subcategoryChild.SLUG_EXISTS';
      }
      throw new BadRequestException({
        message: await this.i18n.t(messageKey, { lang }),
      });
    }
  }

  @Get()
  async findAll(
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Query('search') search: string,
    @Query('parentSubCategory') parentSubCategory: string,
    @Req() req,
  ) {
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;

    const result = await this.subcategoryChildService.findAll({
      page: pageNum,
      limit: limitNum,
      search,
      parentSubCategory,
    });

    const lang = this.getLang(req);
    const totalPages = Math.ceil(result.total / limitNum);

    return formatResponse(
      {
        subcategoryChildren: result.data,
        total: result.total,
        page: pageNum,
        limit: limitNum,
        next: pageNum < totalPages,
        previous: pageNum > 1,
      },
      await this.i18n.t('subcategoryChild.FETCH_SUCCESS', { lang }),
    );
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req) {
    const child = await this.subcategoryChildService.findOne(id);
    const lang = this.getLang(req);
    return formatResponse(child, await this.i18n.t('subcategoryChild.FETCH_SUCCESS', { lang }));
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async update(@Param('id') id: string, @Body() dto: UpdateSubcategoryChildDto, @Req() req) {
    const child = await this.subcategoryChildService.update(id, dto);
    const lang = this.getLang(req);
    return formatResponse(child, await this.i18n.t('subcategoryChild.UPDATE_SUCCESS', { lang }));
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async remove(@Param('id') id: string, @Req() req) {
    await this.subcategoryChildService.remove(id);
    const lang = this.getLang(req);
    return formatResponse(null, await this.i18n.t('subcategoryChild.DELETE_SUCCESS', { lang }));
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateSubcategoryChildStatusDto,
    @Req() req,
  ) {
    const child = await this.subcategoryChildService.updateStatus(id, dto);
    const lang = this.getLang(req);

    return formatResponse(
      child,
      await this.i18n.t('subcategoryChild.STATUS_UPDATE_SUCCESS', { lang }),
    );
  }
}


