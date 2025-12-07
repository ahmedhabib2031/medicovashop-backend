import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiParam } from '@nestjs/swagger';
import { AttributesService } from './attributes.service';
import { CreateProductAttributeDto } from './dto/create-attribute.dto';
import { UpdateProductAttributeDto } from './dto/update-attribute.dto';
import { UpdateAttributeStatusDto } from './dto/update-attribute-status.dto';
import { I18nService } from 'nestjs-i18n';
import { JwtAuthGuard } from 'src/auth/guards';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/roles.decorator';
import { UserRole } from 'src/users/entities/user.entity';
import { formatResponse } from 'src/common/utils/response.util';

@ApiTags('Attributes')
@ApiBearerAuth('JWT-auth')
@Controller('attributes')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AttributesController {
  constructor(
    private readonly attributesService: AttributesService,
    private readonly i18n: I18nService,
  ) {}

  private getLang(req: any): string {
    return req.headers['accept-language']?.split(',')[0] || 'en';
  }

  @Post()
  @ApiOperation({ summary: 'Create a new product attribute', description: 'Create a new product attribute (Admin only)' })
  @ApiResponse({ status: 201, description: 'Attribute successfully created' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async create(@Body() dto: CreateProductAttributeDto, @Req() req) {
    const attribute = await this.attributesService.create(dto);
    const lang = this.getLang(req);
    return formatResponse(attribute, await this.i18n.t('attribute.CREATE_SUCCESS', { lang }));
  }

  @Get()
  @ApiOperation({ summary: 'Get all product attributes', description: 'Get paginated list of product attributes with optional filters' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search by title' })
  @ApiQuery({ name: 'categoryId', required: false, type: String, description: 'Filter by category ID' })
  @ApiQuery({ name: 'subcategoryId', required: false, type: String, description: 'Filter by subcategory ID' })
  @ApiQuery({ name: 'active', required: false, type: Boolean, description: 'Filter by active status' })
  @ApiResponse({ status: 200, description: 'Attributes retrieved successfully' })
  async findAll(
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Query('search') search: string,
    @Query('categoryId') categoryId: string,
    @Query('subcategoryId') subcategoryId: string,
    @Query('active') active: string,
    @Req() req,
  ) {
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const activeBool = active === 'true' ? true : active === 'false' ? false : undefined;

    const result = await this.attributesService.findAll({
      page: pageNum,
      limit: limitNum,
      search,
      categoryId,
      subcategoryId,
      active: activeBool,
    });

    const lang = this.getLang(req);
    const totalPages = Math.ceil(result.total / limitNum);

    return formatResponse(
      {
        attributes: result.data,
        total: result.total,
        page: pageNum,
        limit: limitNum,
        next: pageNum < totalPages,
        previous: pageNum > 1,
      },
      await this.i18n.t('attribute.FETCH_SUCCESS', { lang }),
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get attribute by ID', description: 'Get a single product attribute by its ID' })
  @ApiParam({ name: 'id', description: 'Attribute ID' })
  @ApiResponse({ status: 200, description: 'Attribute retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Attribute not found' })
  async findOne(@Param('id') id: string, @Req() req) {
    const attribute = await this.attributesService.findOne(id);
    const lang = this.getLang(req);
    return formatResponse(attribute, await this.i18n.t('attribute.FETCH_SUCCESS', { lang }));
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update attribute', description: 'Update an existing product attribute' })
  @ApiParam({ name: 'id', description: 'Attribute ID' })
  @ApiResponse({ status: 200, description: 'Attribute successfully updated' })
  @ApiResponse({ status: 404, description: 'Attribute not found' })
  async update(@Param('id') id: string, @Body() dto: UpdateProductAttributeDto, @Req() req) {
    const attribute = await this.attributesService.update(id, dto);
    const lang = this.getLang(req);
    return formatResponse(attribute, await this.i18n.t('attribute.UPDATE_SUCCESS', { lang }));
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update attribute status', description: 'Update the active status of a product attribute' })
  @ApiParam({ name: 'id', description: 'Attribute ID' })
  @ApiResponse({ status: 200, description: 'Attribute status successfully updated' })
  @ApiResponse({ status: 404, description: 'Attribute not found' })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateAttributeStatusDto,
    @Req() req,
  ) {
    const attribute = await this.attributesService.updateStatus(id, dto);
    const lang = this.getLang(req);
    return formatResponse(attribute, await this.i18n.t('attribute.STATUS_UPDATE_SUCCESS', { lang }));
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete attribute', description: 'Delete a product attribute by ID' })
  @ApiParam({ name: 'id', description: 'Attribute ID' })
  @ApiResponse({ status: 200, description: 'Attribute successfully deleted' })
  @ApiResponse({ status: 404, description: 'Attribute not found' })
  async remove(@Param('id') id: string, @Req() req) {
    await this.attributesService.remove(id);
    const lang = this.getLang(req);
    return formatResponse(null, await this.i18n.t('attribute.DELETE_SUCCESS', { lang }));
  }
}
