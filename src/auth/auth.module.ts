import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { MongooseModule } from '@nestjs/mongoose';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { EmailService } from './services/email.service';

import { JwtStrategy } from './jwt.strategy';

import { UsersModule } from '../users/users.module';
import { Otp, OtpSchema } from './entities/otp.entity';

@Module({
  imports: [
    UsersModule, // already contains User model
    MongooseModule.forFeature([{ name: Otp.name, schema: OtpSchema }]),

    PassportModule.register({ defaultStrategy: 'jwt' }),

    JwtModule.register({
      secret: process.env.JWT_SECRET || '65432wf34678uyge4787543rtyu676trew3',
      signOptions: { expiresIn: '1h' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, EmailService],
  exports: [AuthService, JwtStrategy, PassportModule, JwtModule],
})
export class AuthModule {}
