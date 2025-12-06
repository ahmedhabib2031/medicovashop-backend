import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiTags('Root')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: 'API Root', description: 'Get API information and available endpoints' })
  @ApiResponse({ status: 200, description: 'API information retrieved successfully' })
  getRoot() {
    return this.appService.getRoot();
  }
}
