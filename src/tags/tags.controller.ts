import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards, Req } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { TagsService } from './tags.service';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@Controller('tags')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class TagsController {
  constructor(
    private readonly tagsService: TagsService,
    private readonly i18n: I18nService,
  ) {}

  private getLang(req: any): string {
    return req.headers['accept-language']?.split(',')[0] || 'en';
  }

  @Post()
  async create(@Body() dto: CreateTagDto, @Req() req) {
    const tag = await this.tagsService.create(dto);
    const lang = this.getLang(req);
    return {
      data: tag,
      message: await this.i18n.t('tags.TAG_CREATED', { lang }),
    };
  }

  @Get()
  async findAll(@Req() req) {
    const tags = await this.tagsService.findAll();
    const lang = this.getLang(req);
    return {
      data: tags,
      message: await this.i18n.t('tags.TAGS_FETCHED', { lang }),
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req) {
    const tag = await this.tagsService.findOne(id);
    const lang = this.getLang(req);
    return {
      data: tag,
      message: await this.i18n.t('tags.TAG_FETCHED', { lang }),
    };
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateTagDto, @Req() req) {
    const tag = await this.tagsService.update(id, dto);
    const lang = this.getLang(req);
    return {
      data: tag,
      message: await this.i18n.t('tags.TAG_UPDATED', { lang }),
    };
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req) {
    await this.tagsService.remove(id);
    const lang = this.getLang(req);
    return {
      message: await this.i18n.t('tags.TAG_DELETED', { lang }),
    };
  }
}
