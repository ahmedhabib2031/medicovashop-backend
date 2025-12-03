import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwt: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const exists = await this.usersService.findByEmail(dto.email);
    if (exists) throw new BadRequestException('EMAIL_EXISTS');

    const hashed = await bcrypt.hash(dto.password, 10);
    const user = await this.usersService.create({ ...dto, password: hashed });

    return this.generateTokens(user);
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) throw new UnauthorizedException('INVALID_CREDENTIALS');

    const match = await bcrypt.compare(dto.password, user.password);
    if (!match) throw new UnauthorizedException('INVALID_CREDENTIALS');

    return this.generateTokens(user);
  }

  generateTokens(user: any) {
    // relax type to `any` or Mongoose Document
    const payload = {
      id: user._id?.toString() || user.id, // fallback if needed
      role: user.role,
      language: user.language,
    };
    return {
      accessToken: this.jwt.sign(payload, { expiresIn: '1d' }),
    };
  }

  async getUserByEmail(email: string) {
    return this.usersService.findByEmail(email);
  }
}
