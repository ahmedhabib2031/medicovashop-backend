import { Controller, Post, Body, Req, UseGuards, Get, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiHeader } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { SendOtpDto } from './dto/send-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { I18nService } from 'nestjs-i18n';
import { RefreshTokenGuard } from './guards/refresh-token.guard';

@ApiTags('Auth')
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
  @ApiOperation({ summary: 'Register a new user', description: 'Create a new user account' })
  @ApiResponse({ status: 201, description: 'User successfully registered' })
  @ApiResponse({ status: 400, description: 'Email already exists' })
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
  @ApiOperation({ summary: 'User login', description: 'Authenticate user and get access token' })
  @ApiResponse({ status: 200, description: 'User successfully logged in' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
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
  @ApiOperation({ summary: 'Refresh access token', description: 'Get a new access token using refresh token' })
  @ApiBearerAuth('JWT-auth')
  @ApiHeader({ name: 'x-user-id', description: 'User ID', required: true })
  @ApiResponse({ status: 200, description: 'Token successfully refreshed' })
  @ApiResponse({ status: 401, description: 'Invalid or expired refresh token' })
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

  @Post('send-otp')
  @ApiOperation({
    summary: 'Send OTP to email',
    description: 'Send a one-time password (OTP) to the specified email address',
  })
  @ApiResponse({ status: 200, description: 'OTP sent successfully' })
  @ApiResponse({ status: 400, description: 'Invalid email address' })
  @ApiResponse({ status: 500, description: 'Failed to send OTP email' })
  async sendOtp(@Body() dto: SendOtpDto, @Req() req) {
    try {
      const result = await this.authService.sendOtp(dto);
      const lang = this.getLang(req);
      return {
        data: result,
        message: await this.i18n.t('auth.OTP_SENT', { lang }),
      };
    } catch (error) {
      const lang = this.getLang(req);
      throw new BadRequestException({
        message: await this.i18n.t('auth.OTP_SEND_FAILED', { lang }),
      });
    }
  }

  @Post('verify-otp')
  @ApiOperation({
    summary: 'Verify OTP',
    description: 'Verify the OTP code sent to the email address',
  })
  @ApiResponse({ status: 200, description: 'OTP verified successfully' })
  @ApiResponse({ status: 400, description: 'Invalid or expired OTP code' })
  @ApiResponse({ status: 404, description: 'OTP not found' })
  async verifyOtp(@Body() dto: VerifyOtpDto, @Req() req) {
    try {
      const result = await this.authService.verifyOtp(dto);
      const lang = this.getLang(req);
      return {
        data: result,
        message: await this.i18n.t('auth.OTP_VERIFIED', { lang }),
      };
    } catch (error) {
      const lang = this.getLang(req);
      if (error.status === 404) {
        throw new BadRequestException({
          message: await this.i18n.t('auth.OTP_NOT_FOUND', { lang }),
        });
      }
      throw new BadRequestException({
        message: error.message || await this.i18n.t('auth.OTP_VERIFICATION_FAILED', { lang }),
      });
    }
  }
}
