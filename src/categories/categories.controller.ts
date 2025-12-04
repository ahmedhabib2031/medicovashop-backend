import { Controller, Get, Post, Put, Delete, Body, Param, Req, UseGuards, BadRequestException, Query, Patch } from '@nestjs/common';
import { CategoryService } from './categories.service';
import { CreateCategoryDto, UpdateCategoryDto, UpdateCategoryStatusDto } from './dto/category.dto'
import { I18nService } from 'nestjs-i18n';
import { UserRole } from 'src/users/entities/user.entity';
import { Roles } from 'src/auth/roles.decorator';
import { RolesGuard } from 'src/auth/roles.guard';
import { JwtAuthGuard } from 'src/auth/guards';
import { formatResponse } from 'src/common/utils/response.util';

@Controller('category')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class CategoryController {
  constructor(
    private readonly categoryService: CategoryService,
    private readonly i18n: I18nService,
  ) {}

  private getLang(req: any) {
    return req.headers['accept-language']?.split(',')[0] || 'en';
  }

  @Post()
  async create(@Body() dto: CreateCategoryDto, @Req() req) {
    try {
      const category = await this.categoryService.create(dto);
      const lang = this.getLang(req);
      return formatResponse(category, await this.i18n.t('category.CREATE_SUCCESS', { lang }));
    } catch (err) {
      const lang = this.getLang(req);
      let messageKey = 'category.CREATE_FAILED';
      if (err.response?.message === 'CATEGORY_SLUG_ALREADY_EXISTS') {
        messageKey = 'category.SLUG_EXISTS';
      } else if (err.response?.message === 'CATEGORY_SLUG_AR_ALREADY_EXISTS') {
        messageKey = 'category.SLUG_AR_EXISTS';
      }
      throw new BadRequestException(formatResponse(null, await this.i18n.t(messageKey, { lang }), 'error'));
    }
  }


@Get()
async findAll(
  @Query('page') page: string,
  @Query('limit') limit: string,
  @Query('search') search: string,
  @Req() req,
) {
  const pageNum = parseInt(page) || 1;
  const limitNum = parseInt(limit) || 10;

  const result = await this.categoryService.findAll({
    page: pageNum,
    limit: limitNum,
    search,
  });

  const lang = this.getLang(req);
  const totalPages = Math.ceil(result.total / limitNum);

  return formatResponse(
    {
      categories: result.data,
      total: result.total,
      page: pageNum,
      limit: limitNum,
      next: pageNum < totalPages,    // true if there is a next page
      previous: pageNum > 1, 
    },
    await this.i18n.t('category.FETCH_SUCCESS', { lang }),
  );
}



  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req) {
    const category = await this.categoryService.findOne(id);
    const lang = this.getLang(req);
    return {
      data: category,
      message: await this.i18n.t('category.FETCH_SUCCESS', { lang }),
    };
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateCategoryDto, @Req() req) {
    const category = await this.categoryService.update(id, dto);
    const lang = this.getLang(req);
    return {
      data: category,
      message: await this.i18n.t('category.UPDATE_SUCCESS', { lang }),
    };
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req) {
    await this.categoryService.remove(id);
    const lang = this.getLang(req);
    return {
      message: await this.i18n.t('category.DELETE_SUCCESS', { lang }),
    };
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateCategoryStatusDto,
    @Req() req
  ) {
    const category = await this.categoryService.updateStatus(id, dto);
    const lang = this.getLang(req);

    return formatResponse(
      category,
      await this.i18n.t('category.STATUS_UPDATE_SUCCESS', { lang }),
    );
  }
}
