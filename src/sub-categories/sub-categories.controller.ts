import { Controller, Get, Post, Put, Delete, Body, Param, Req, Query, UseGuards, BadRequestException, Patch } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiParam } from '@nestjs/swagger';
import { SubCategoryService } from './sub-categories.service';
import { CreateSubCategoryDto, UpdateSubCategoryDto, UpdateSubCategoryStatusDto } from './dto/subcategory.dto';
import { I18nService } from 'nestjs-i18n';
import { JwtAuthGuard } from 'src/auth/guards';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/roles.decorator';
import { UserRole } from 'src/users/entities/user.entity';
import { formatResponse } from 'src/common/utils/response.util';

@ApiTags('Subcategories')
@ApiBearerAuth('JWT-auth')
@Controller('subcategory')
export class SubCategoryController {
  constructor(
    private readonly subCategoryService: SubCategoryService,
    private readonly i18n: I18nService,
  ) {}

  private getLang(req: any) {
    return req.headers['accept-language']?.split(',')[0] || 'en';
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new subcategory', description: 'Create a new subcategory (Admin only)' })
  @ApiResponse({ status: 201, description: 'Subcategory successfully created' })
  @ApiResponse({ status: 400, description: 'Bad request - slug already exists' })
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
  @ApiOperation({ summary: 'Get all subcategories', description: 'Get paginated list of subcategories with optional filters' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'parentCategory', required: false, type: String, description: 'Filter by parent category ID' })
  @ApiResponse({ status: 200, description: 'Subcategories retrieved successfully' })
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
  @ApiOperation({ summary: 'Get subcategory by ID', description: 'Get a single subcategory by its ID' })
  @ApiParam({ name: 'id', description: 'Subcategory ID' })
  @ApiResponse({ status: 200, description: 'Subcategory retrieved successfully' })
  async findOne(@Param('id') id: string, @Req() req) {
    const subCategory = await this.subCategoryService.findOne(id);
    const lang = this.getLang(req);
    return formatResponse(subCategory, await this.i18n.t('subcategory.FETCH_SUCCESS', { lang }));
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update subcategory', description: 'Update an existing subcategory' })
  @ApiParam({ name: 'id', description: 'Subcategory ID' })
  @ApiResponse({ status: 200, description: 'Subcategory successfully updated' })
  async update(@Param('id') id: string, @Body() dto: UpdateSubCategoryDto, @Req() req) {
    const subCategory = await this.subCategoryService.update(id, dto);
    const lang = this.getLang(req);
    return formatResponse(subCategory, await this.i18n.t('subcategory.UPDATE_SUCCESS', { lang }));
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete subcategory', description: 'Delete a subcategory by ID' })
  @ApiParam({ name: 'id', description: 'Subcategory ID' })
  @ApiResponse({ status: 200, description: 'Subcategory successfully deleted' })
  async remove(@Param('id') id: string, @Req() req) {
    await this.subCategoryService.remove(id);
    const lang = this.getLang(req);
    return formatResponse(null, await this.i18n.t('subcategory.DELETE_SUCCESS', { lang }));
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update subcategory status', description: 'Update the active status of a subcategory' })
  @ApiParam({ name: 'id', description: 'Subcategory ID' })
  @ApiResponse({ status: 200, description: 'Subcategory status successfully updated' })
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
