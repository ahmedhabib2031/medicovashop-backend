import { IsEmail, IsEnum, IsNotEmpty, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../../users/entities/user.entity';

export class RegisterDto {
  @ApiProperty({ example: 'John', description: 'User first name' })
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ example: 'Doe', description: 'User last name' })
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({ example: 'john.doe@example.com', description: 'User email address' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'en', enum: ['en', 'ar'], description: 'User preferred language' })
  @IsNotEmpty()
  language: string;

  @ApiProperty({ example: 'password123', description: 'User password (minimum 6 characters)', minLength: 6 })
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'user', enum: UserRole, description: 'User role' })
  @IsEnum(UserRole)
  role: UserRole;
}
