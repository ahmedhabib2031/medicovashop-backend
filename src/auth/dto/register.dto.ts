import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  MinLength,
  IsString,
  Matches,
  IsOptional,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../../users/entities/user.entity';

export class RegisterDto {
  @ApiProperty({
    example: 'John',
    description: 'First name (required for all roles)',
    required: false,
  })
  @IsString()
  @IsNotEmpty({ message: 'First name is required' })
  firstName: string;

  @ApiProperty({
    example: 'Doe',
    description: 'Last name (required for all roles)',
    required: false,
  })
  @IsString()
  @IsNotEmpty({ message: 'Last name is required' })
  lastName: string;

  @ApiProperty({
    example: 'john.doe@example.com',
    description: 'User email address',
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    example: '+1234567890',
    description: 'User phone number (optional)',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Matches(/^\+?[1-9]\d{1,14}$/, {
    message: 'Please provide a valid phone number (e.g., +1234567890)',
  })
  phone?: string;

  @ApiProperty({
    example: 'en',
    enum: ['en', 'ar'],
    description: 'User preferred language',
  })
  @IsNotEmpty()
  language: string;

  @ApiProperty({
    example: 'StrongP@ssw0rd123',
    description:
      'User password (minimum 8 characters, must contain uppercase, lowercase, number, and special character)',
    minLength: 8,
  })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message:
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)',
  })
  password: string;

  @ApiProperty({ example: 'user', enum: UserRole, description: 'User role' })
  @IsEnum(UserRole)
  role: UserRole;
}
