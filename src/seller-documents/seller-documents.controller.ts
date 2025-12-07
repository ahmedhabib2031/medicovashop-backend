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
import { SellerDocumentsService } from './seller-documents.service';
import { UploadSellerDocumentDto } from './dto/upload-seller-document.dto';
import { UpdateDocumentStatusDto } from './dto/update-document-status.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { I18nService } from 'nestjs-i18n';
import { formatResponse } from '../common/utils/response.util';
import { DocumentStatus } from './entities/seller-document.entity';

@ApiTags('Seller Documents')
@ApiBearerAuth('JWT-auth')
@Controller('seller-documents')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SellerDocumentsController {
  constructor(
    private readonly sellerDocumentsService: SellerDocumentsService,
    private readonly i18n: I18nService,
  ) {}

  private getLang(req: any) {
    return req.headers['accept-language']?.split(',')[0] || 'en';
  }

  @Post()
  @Roles(UserRole.SELLER)
  @ApiOperation({
    summary: 'Upload seller documents',
    description: 'Upload ID front and back documents (Seller only)',
  })
  @ApiResponse({ status: 201, description: 'Documents uploaded successfully' })
  @ApiResponse({ status: 400, description: 'Documents already exist for this seller' })
  async uploadDocuments(@Body() dto: UploadSellerDocumentDto, @Req() req) {
    try {
      const document = await this.sellerDocumentsService.create(
        req.user.id,
        dto,
      );
      const lang = this.getLang(req);
      return formatResponse(
        document,
        await this.i18n.t('sellerDocument.UPLOAD_SUCCESS', { lang }),
      );
    } catch (err) {
      const lang = this.getLang(req);
      throw new BadRequestException(
        formatResponse(
          null,
          await this.i18n.t('sellerDocument.UPLOAD_FAILED', { lang }),
          'error',
        ),
      );
    }
  }

  @Put()
  @Roles(UserRole.SELLER)
  @ApiOperation({
    summary: 'Update seller documents',
    description: 'Update ID front and back documents (Seller only)',
  })
  @ApiResponse({ status: 200, description: 'Documents updated successfully' })
  @ApiResponse({ status: 404, description: 'Documents not found' })
  async updateDocuments(@Body() dto: UploadSellerDocumentDto, @Req() req) {
    const document = await this.sellerDocumentsService.update(
      req.user.id,
      dto,
    );
    const lang = this.getLang(req);
    return formatResponse(
      document,
      await this.i18n.t('sellerDocument.UPDATE_SUCCESS', { lang }),
    );
  }

  @Get('me')
  @Roles(UserRole.SELLER)
  @ApiOperation({
    summary: 'Get seller own documents',
    description: 'Get the current seller\'s documents (Seller only)',
  })
  @ApiResponse({ status: 200, description: 'Documents fetched successfully' })
  @ApiResponse({ status: 404, description: 'Documents not found' })
  async getMyDocuments(@Req() req) {
    const document = await this.sellerDocumentsService.findBySellerId(
      req.user.id,
    );
    if (!document) {
      const lang = this.getLang(req);
      throw new BadRequestException(
        formatResponse(
          null,
          await this.i18n.t('sellerDocument.DOCUMENT_NOT_FOUND', { lang }),
          'error',
        ),
      );
    }
    const lang = this.getLang(req);
    return formatResponse(
      document,
      await this.i18n.t('sellerDocument.FETCH_SUCCESS', { lang }),
    );
  }

  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Get all seller documents',
    description: 'Get all documents with pagination and status filter (Admin only)',
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, enum: DocumentStatus })
  @ApiResponse({ status: 200, description: 'Documents fetched successfully' })
  async findAll(
    @Query('page') page,
    @Query('limit') limit,
    @Query('status') status: DocumentStatus,
    @Req() req,
  ) {
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;

    const query: any = { page: pageNum, limit: limitNum };
    if (status) {
      query.status = status;
    }

    const result = await this.sellerDocumentsService.findAll(query);
    const totalPages = Math.ceil(result.total / limitNum);

    const lang = this.getLang(req);

    return formatResponse(
      {
        documents: result.data,
        total: result.total,
        page: pageNum,
        limit: limitNum,
        next: pageNum < totalPages,
        previous: pageNum > 1,
      },
      await this.i18n.t('sellerDocument.FETCH_SUCCESS', { lang }),
    );
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.SELLER)
  @ApiOperation({
    summary: 'Get seller document by ID',
    description: 'Get a specific document by ID (Admin can access any, Seller can only access their own)',
  })
  @ApiParam({ name: 'id', description: 'Document ID' })
  @ApiResponse({ status: 200, description: 'Document fetched successfully' })
  @ApiResponse({ status: 404, description: 'Document not found' })
  async findOne(@Param('id') id: string, @Req() req) {
    const document = await this.sellerDocumentsService.findOne(id);

    // If seller, ensure they can only access their own document
    if (req.user.role === UserRole.SELLER) {
      const docSellerId =
        (document as any).sellerId?._id?.toString() ||
        (document as any).sellerId?.toString();
      if (docSellerId !== req.user.id) {
        throw new ForbiddenException('Access denied');
      }
    }

    const lang = this.getLang(req);
    return formatResponse(
      document,
      await this.i18n.t('sellerDocument.FETCH_SUCCESS', { lang }),
    );
  }

  @Patch(':id/status')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Approve or reject seller documents',
    description: 'Update document status to approved or rejected (Admin only)',
  })
  @ApiParam({ name: 'id', description: 'Document ID' })
  @ApiResponse({ status: 200, description: 'Document status updated successfully' })
  @ApiResponse({ status: 400, description: 'Rejection reason required when rejecting' })
  @ApiResponse({ status: 404, description: 'Document not found' })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateDocumentStatusDto,
    @Req() req,
  ) {
    const document = await this.sellerDocumentsService.updateStatus(id, dto);
    const lang = this.getLang(req);
    return formatResponse(
      document,
      await this.i18n.t('sellerDocument.STATUS_UPDATE_SUCCESS', { lang }),
    );
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Delete seller document',
    description: 'Delete a document (Admin only)',
  })
  @ApiParam({ name: 'id', description: 'Document ID' })
  @ApiResponse({ status: 200, description: 'Document deleted successfully' })
  @ApiResponse({ status: 404, description: 'Document not found' })
  async remove(@Param('id') id: string, @Req() req) {
    await this.sellerDocumentsService.remove(id);
    const lang = this.getLang(req);
    return formatResponse(
      null,
      await this.i18n.t('sellerDocument.DELETE_SUCCESS', { lang }),
    );
  }
}

