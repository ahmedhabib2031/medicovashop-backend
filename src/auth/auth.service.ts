import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UserRole } from '../users/entities/user.entity';

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

  // ==========================
  // GOOGLE AUTH
  // ==========================
  async googleLogin(user: any) {
    if (!user.email) {
      throw new BadRequestException('No email provided from Google');
    }

    // Check if user exists by email
    let existingUser = await this.usersService.findByEmail(user.email);

    if (existingUser) {
      // User exists, update googleId if not set
      if (!(existingUser as any).googleId) {
        await this.usersService.updateSocialId(existingUser._id.toString(), 'googleId', user.googleId);
      }
      return this.generateTokens(existingUser);
    }

    // Check if user exists by googleId
    existingUser = await this.usersService.findBySocialId('googleId', user.googleId);
    if (existingUser) {
      return this.generateTokens(existingUser);
    }

    // Create new user
    const newUser = await this.usersService.create({
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      password: crypto.randomBytes(32).toString('hex'), // Random password for social auth
      googleId: user.googleId,
      role: UserRole.USER,
      language: 'en',
    });

    return this.generateTokens(newUser);
  }

  // ==========================
  // FACEBOOK AUTH
  // ==========================
  async facebookLogin(user: any) {
    if (!user.email) {
      throw new BadRequestException('No email provided from Facebook');
    }

    // Check if user exists by email
    let existingUser = await this.usersService.findByEmail(user.email);

    if (existingUser) {
      // User exists, update facebookId if not set
      if (!(existingUser as any).facebookId) {
        await this.usersService.updateSocialId(existingUser._id.toString(), 'facebookId', user.facebookId);
      }
      return this.generateTokens(existingUser);
    }

    // Check if user exists by facebookId
    existingUser = await this.usersService.findBySocialId('facebookId', user.facebookId);
    if (existingUser) {
      return this.generateTokens(existingUser);
    }

    // Create new user
    const newUser = await this.usersService.create({
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      password: crypto.randomBytes(32).toString('hex'), // Random password for social auth
      facebookId: user.facebookId,
      role: UserRole.USER,
      language: 'en',
    });

    return this.generateTokens(newUser);
  }

  // ==========================
  // VERIFY GOOGLE TOKEN (for Postman testing)
  // ==========================
  async verifyGoogleToken(accessToken: string) {
    try {
      const response = await fetch(`https://www.googleapis.com/oauth2/v2/userinfo?access_token=${accessToken}`);
      if (!response.ok) {
        throw new UnauthorizedException('Invalid Google token');
      }
      const googleUser = await response.json();
      
      const user = {
        email: googleUser.email,
        firstName: googleUser.given_name,
        lastName: googleUser.family_name,
        googleId: googleUser.id,
        picture: googleUser.picture,
      };

      return this.googleLogin(user);
    } catch (error) {
      throw new UnauthorizedException('Failed to verify Google token');
    }
  }

  // ==========================
  // VERIFY FACEBOOK TOKEN (for Postman testing)
  // ==========================
  async verifyFacebookToken(accessToken: string) {
    try {
      const response = await fetch(`https://graph.facebook.com/me?fields=id,email,first_name,last_name,picture&access_token=${accessToken}`);
      if (!response.ok) {
        throw new UnauthorizedException('Invalid Facebook token');
      }
      const facebookUser = await response.json();
      
      const user = {
        email: facebookUser.email,
        firstName: facebookUser.first_name,
        lastName: facebookUser.last_name,
        facebookId: facebookUser.id,
        picture: facebookUser.picture?.data?.url,
      };

      return this.facebookLogin(user);
    } catch (error) {
      throw new UnauthorizedException('Failed to verify Facebook token');
    }
  }
}
