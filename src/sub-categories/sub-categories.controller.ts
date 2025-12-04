import { Controller, Get, Post, Put, Delete, Body, Param, Req, Query, UseGuards, BadRequestException, Patch } from '@nestjs/common';
import { SubCategoryService } from './sub-categories.service';
import { CreateSubCategoryDto, UpdateSubCategoryDto, UpdateSubCategoryStatusDto } from './dto/subcategory.dto';
import { I18nService } from 'nestjs-i18n';
import { JwtAuthGuard } from 'src/auth/guards';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/roles.decorator';
import { UserRole } from 'src/users/entities/user.entity';
import { formatResponse } from 'src/common/utils/response.util';

@Controller('subcategory')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class SubCategoryController {
  constructor(
    private readonly subCategoryService: SubCategoryService,
    private readonly i18n: I18nService,
  ) {}

  private getLang(req: any) {
    return req.headers['accept-language']?.split(',')[0] || 'en';
  }

  @Post()
  async create(@Body() dto: CreateSubCategoryDto, @Req() req) {
    try {
      const subCategory = await this.subCategoryService.create(dto);
      const lang = this.getLang(req);
      return formatResponse(subCategory, await this.i18n.t('subcategory.CREATE_SUCCESS', { lang }));
    } catch (err) {
      const lang = this.getLang(req);
      let messageKey = 'subcategory.CREATE_FAILED';
      if (err.response?.message === 'SUBCATEGORY_SLUG_ALREADY_EXISTS') {
        messageKey = 'subcategory.SLUG_EXISTS';
      }
      throw new BadRequestException({ message: await this.i18n.t(messageKey, { lang }) });
    }
  }

  @Get()
  async findAll(
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Query('search') search: string,
    @Query('parentCategory') parentCategory: string,
    @Req() req,
  ) {
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;

    const result = await this.subCategoryService.findAll({
      page: pageNum,
      limit: limitNum,
      search,
      parentCategory,
    });

    const lang = this.getLang(req);
    const totalPages = Math.ceil(result.total / limitNum);

    return formatResponse(
      {
        subCategories: result.data,
        total: result.total,
        page: pageNum,
        limit: limitNum,
        next: pageNum < totalPages,
        previous: pageNum > 1,
      },
      await this.i18n.t('subcategory.FETCH_SUCCESS', { lang }),
    );
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req) {
    const subCategory = await this.subCategoryService.findOne(id);
    const lang = this.getLang(req);
    return formatResponse(subCategory, await this.i18n.t('subcategory.FETCH_SUCCESS', { lang }));
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateSubCategoryDto, @Req() req) {
    const subCategory = await this.subCategoryService.update(id, dto);
    const lang = this.getLang(req);
    return formatResponse(subCategory, await this.i18n.t('subcategory.UPDATE_SUCCESS', { lang }));
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req) {
    await this.subCategoryService.remove(id);
    const lang = this.getLang(req);
    return formatResponse(null, await this.i18n.t('subcategory.DELETE_SUCCESS', { lang }));
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateSubCategoryStatusDto,
    @Req() req,
  ) {
    const subCategory = await this.subCategoryService.updateStatus(id, dto);
    const lang = this.getLang(req);

    return formatResponse(
      subCategory,
      await this.i18n.t('subcategory.STATUS_UPDATE_SUCCESS', { lang }),
    );
  }
}
