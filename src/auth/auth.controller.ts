import { Controller, Post, Body, Req, UseGuards, Get, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { GoogleLoginDto, FacebookLoginDto } from './dto/social-login.dto';
import { I18nService } from 'nestjs-i18n';
import { RefreshTokenGuard } from './guards/refresh-token.guard';
import { AuthGuard } from '@nestjs/passport';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private readonly i18n: I18nService,
  ) {}

  private getLang(req: any, user?: any): string {
    return req.headers['accept-language']?.split(',')[0] || user?.language || 'en';
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
      const lang = this.getLang(req);
      throw new BadRequestException({
        message: await this.i18n.t('auth.EMAIL_EXISTS', { lang }),
      });
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

  @UseGuards(RefreshTokenGuard)
  @Get('refresh')
  async refresh(@Req() req) {
    const refreshToken = req.refreshToken;
    const userId = req.headers['x-user-id'];
    if (!userId) throw new UnauthorizedException('User ID missing');

    const tokens = await this.authService.refreshTokens(userId, refreshToken);

    return {
      data: tokens,
      message: await this.i18n.t('auth.TOKEN_REFRESHED', { lang: tokens.user.language || 'en' }),
    };
  }

  // Google OAuth
  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {
    // Guard redirects to Google
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthCallback(@Req() req) {
    const user = req.user;
    const result = await this.authService.googleLogin(user);
    const lang = this.getLang(req, result.user);

    return {
      data: result,
      message: await this.i18n.t('auth.LOGIN_SUCCESS', { lang }),
    };
  }

  // Facebook OAuth
  @Get('facebook')
  @UseGuards(AuthGuard('facebook'))
  async facebookAuth() {
    // Guard redirects to Facebook
  }

  @Get('facebook/callback')
  @UseGuards(AuthGuard('facebook'))
  async facebookAuthCallback(@Req() req) {
    const user = req.user;
    const result = await this.authService.facebookLogin(user);
    const lang = this.getLang(req, result.user);

    return {
      data: result,
      message: await this.i18n.t('auth.LOGIN_SUCCESS', { lang }),
    };
  }

  // ==========================
  // POSTMAN TEST ENDPOINTS (Direct token verification)
  // ==========================

  @Post('google/token')
  async googleTokenLogin(@Body() dto: GoogleLoginDto, @Req() req) {
    try {
      const result = await this.authService.verifyGoogleToken(dto.accessToken);
      const lang = this.getLang(req, result.user);

      return {
        data: result,
        message: await this.i18n.t('auth.LOGIN_SUCCESS', { lang }),
      };
    } catch (error) {
      throw new UnauthorizedException({
        message: error.message || 'Failed to authenticate with Google',
      });
    }
  }

  @Post('facebook/token')
  async facebookTokenLogin(@Body() dto: FacebookLoginDto, @Req() req) {
    try {
      const result = await this.authService.verifyFacebookToken(dto.accessToken);
      const lang = this.getLang(req, result.user);

      return {
        data: result,
        message: await this.i18n.t('auth.LOGIN_SUCCESS', { lang }),
      };
    } catch (error) {
      throw new UnauthorizedException({
        message: error.message || 'Failed to authenticate with Facebook',
      });
    }
  }
}
