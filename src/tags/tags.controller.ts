// src/tags/tags.controller.ts
import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards } from '@nestjs/common';
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
  constructor(private readonly tagsService: TagsService) {}

  @Post()
  async create(@Body() dto: CreateTagDto) {
    const tag = await this.tagsService.create(dto);
    return {
      message: 'Tag created successfully',
      data: tag,
    };
  }

  @Get()
  async findAll() {
    const tags = await this.tagsService.findAll();
    return {
      message: 'Tags fetched successfully',
      data: tags,
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const tag = await this.tagsService.findOne(id);
    return {
      message: 'Tag fetched successfully',
      data: tag,
    };
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateTagDto) {
    const tag = await this.tagsService.update(id, dto);
    return {
      message: 'Tag updated successfully',
      data: tag,
    };
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.tagsService.remove(id);
    return {
      message: 'Tag deleted successfully',
    };
  }
}
