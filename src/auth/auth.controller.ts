import {
  Body,
  Controller,
  Post,
  BadRequestException,
  Req,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { I18nService } from 'nestjs-i18n';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private readonly i18n: I18nService,
  ) {}

  // Helper to get language from headers or user object
  private getLang(req: any, user?: any): string {
    return (
      req.headers['accept-language']?.split(',')[0] || user?.language || 'en'
    );
  }

  @Post('register')
  async register(@Body() dto: RegisterDto, @Req() req) {
    try {
      const result = await this.authService.register(dto);
      const lang = this.getLang(req);
      return {
        data: result,
        message: await this.i18n.t('auth.REGISTER_SUCCESS', { lang }),
      };
    } catch (err) {
      const messageKey =
        err?.response?.message || err.message || 'EMAIL_EXISTS';
      const lang = this.getLang(req);
      throw new BadRequestException({ message: messageKey, language: lang });
    }
  }

  @Post('login')
  async login(@Body() dto: LoginDto, @Req() req) {
    const result = await this.authService.login(dto);
    const user = await this.authService.getUserByEmail(dto.email);
    const lang = this.getLang(req, user);

    return {
      data: result,
      message: await this.i18n.t('auth.LOGIN_SUCCESS', { lang }),
    };
  }
}
