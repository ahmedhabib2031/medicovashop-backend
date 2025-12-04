import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwt: JwtService,
  ) {}

  // ==========================
  // REGISTER
  // ==========================
  async register(dto: RegisterDto) {
    const exists = await this.usersService.findByEmail(dto.email);
    if (exists) throw new BadRequestException('EMAIL_EXISTS');

    const hashed = await bcrypt.hash(dto.password, 10);
    const user = await this.usersService.create({ ...dto, password: hashed });

    return this.generateTokens(user);
  }

  // ==========================
  // LOGIN
  // ==========================
  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) throw new UnauthorizedException('INVALID_CREDENTIALS');

    const match = await bcrypt.compare(dto.password, user.password);
    if (!match) throw new UnauthorizedException('INVALID_CREDENTIALS');

    return this.generateTokens(user);
  }

  // ==========================
  // GENERATE ACCESS + REFRESH TOKENS
  // ==========================
  async generateTokens(user: any) {
    const payload = { id: user._id.toString(), role: user.role, language: user.language };
    const accessToken = this.jwt.sign(payload, { expiresIn: '1h' });

    const refreshToken = crypto.randomBytes(64).toString('hex');
    const hashedRefreshToken = crypto.createHash('sha256').update(refreshToken).digest('hex');

    await this.usersService.updateRefreshToken(user._id.toString(), hashedRefreshToken);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user._id.toString(),
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        language: user.language,
      },
    };
  }

  // ==========================
  // REFRESH TOKENS
  // ==========================
  async refreshTokens(userId: string, refreshToken: string) {
    const user = await this.usersService.findById(userId);
    if (!user || !user.currentHashedRefreshToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const now = new Date();
    if ((user as any).refreshTokenExpiresAt && now > (user as any).refreshTokenExpiresAt) {
      throw new UnauthorizedException('Refresh token expired');
    }

    const hashedToken = crypto.createHash('sha256').update(refreshToken).digest('hex');

    if (hashedToken !== user.currentHashedRefreshToken) throw new UnauthorizedException('Invalid refresh token');

    // Do NOT rotate the refresh token here so it can be reused
    // Just issue a new access token while keeping the same refresh token valid
    const safeUser: any = user;
    const payload = { id: safeUser._id.toString(), role: safeUser.role, language: safeUser.language };
    const accessToken = this.jwt.sign(payload, { expiresIn: '1h' });

    return {
      accessToken,
      refreshToken, // same token sent by client
      user: {
        id: safeUser._id.toString(),
        email: safeUser.email,
        role: safeUser.role,
        firstName: safeUser.firstName,
        lastName: safeUser.lastName,
        language: safeUser.language,
      },
    };
  }

  async getUserByEmail(email: string) {
    return this.usersService.findByEmail(email);
  }
}
