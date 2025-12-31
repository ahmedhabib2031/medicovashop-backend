import { Injectable, UnauthorizedException, BadRequestException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UserRole } from '../users/entities/user.entity';
import { Otp, OtpDocument } from './entities/otp.entity';
import { EmailService } from './services/email.service';
import { SendOtpDto } from './dto/send-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwt: JwtService,
    @InjectModel(Otp.name) private otpModel: Model<OtpDocument>,
    private emailService: EmailService,
  ) {}

  // ==========================
  // REGISTER
  // ==========================
  async register(dto: RegisterDto) {
    const exists = await this.usersService.findByEmail(dto.email);
    if (exists) throw new BadRequestException('EMAIL_EXISTS');

    const hashed = await bcrypt.hash(dto.password, 10);
    
    // Prepare user data based on role
    const userData: any = {
      email: dto.email,
      password: hashed,
      language: dto.language,
      role: dto.role,
      phone: dto.phone || null,
    };

    // Set name fields - all roles have firstName and lastName
    userData.firstName = dto.firstName;
    userData.lastName = dto.lastName;
    
    // brandName is not set during registration - sellers will update it later
    userData.brandName = null;

    const user = await this.usersService.create(userData);

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

    // Return appropriate name fields based on role
    const userResponse: any = {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      language: user.language,
    };

    // All users have firstName and lastName
    userResponse.firstName = user.firstName;
    userResponse.lastName = user.lastName;
    
    // Sellers also have brandName
    if (user.role === UserRole.SELLER) {
      userResponse.brandName = user.brandName;
    }

    return {
      accessToken,
      refreshToken,
      user: userResponse,
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

    // Return appropriate name fields based on role
    const userResponse: any = {
      id: safeUser._id.toString(),
      email: safeUser.email,
      role: safeUser.role,
      language: safeUser.language,
    };

    // All users have firstName and lastName
    userResponse.firstName = safeUser.firstName;
    userResponse.lastName = safeUser.lastName;
    
    // Sellers also have brandName
    if (safeUser.role === UserRole.SELLER) {
      userResponse.brandName = safeUser.brandName;
    }

    return {
      accessToken,
      refreshToken, // same token sent by client
      user: userResponse,
    };
  }

  async getUserByEmail(email: string) {
    return this.usersService.findByEmail(email);
  }

  // ==========================
  // SEND OTP
  // ==========================
  async sendOtp(dto: SendOtpDto): Promise<{ message: string }> {
    const { email } = dto;

    // Generate 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Set expiration time (10 minutes from now)
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    // Invalidate any existing unverified OTPs for this email
    await this.otpModel.updateMany(
      { email, verified: false },
      { verified: true }, // Mark as verified to invalidate them
    );

    // Create new OTP record
    await this.otpModel.create({
      email,
      code: otpCode,
      expiresAt,
      verified: false,
      attempts: 0,
    });

    // Send OTP via email
    await this.emailService.sendOtpEmail(email, otpCode);

    return {
      message: 'OTP sent successfully to your email',
    };
  }

  // ==========================
  // VERIFY OTP
  // ==========================
  async verifyOtp(dto: VerifyOtpDto): Promise<{ verified: boolean; message: string }> {
    const { email, code } = dto;

    // Find the most recent unverified OTP for this email
    const otp = await this.otpModel
      .findOne({
        email,
        verified: false,
        expiresAt: { $gt: new Date() }, // Not expired
      })
      .sort({ createdAt: -1 }) // Get the most recent one
      .exec();

    if (!otp) {
      throw new NotFoundException('OTP not found or expired. Please request a new OTP.');
    }

    // Check if maximum attempts exceeded (e.g., 5 attempts)
    const MAX_ATTEMPTS = 5;
    if (otp.attempts >= MAX_ATTEMPTS) {
      throw new BadRequestException(
        'Maximum verification attempts exceeded. Please request a new OTP.',
      );
    }

    // Verify the code
    if (otp.code !== code) {
      // Increment attempts
      otp.attempts += 1;
      await otp.save();

      const remainingAttempts = MAX_ATTEMPTS - otp.attempts;
      throw new BadRequestException(
        `Invalid OTP code. ${remainingAttempts > 0 ? `${remainingAttempts} attempt(s) remaining.` : 'Please request a new OTP.'}`,
      );
    }

    // Mark OTP as verified
    otp.verified = true;
    await otp.save();

    return {
      verified: true,
      message: 'OTP verified successfully',
    };
  }
}
