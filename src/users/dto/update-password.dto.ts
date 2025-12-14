import {
  IsString,
  IsNotEmpty,
  MinLength,
  Matches,
  Validate,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

@ValidatorConstraint({ name: 'MatchPassword', async: false })
export class MatchPasswordConstraint implements ValidatorConstraintInterface {
  validate(confirmNewPassword: string, args: ValidationArguments) {
    const [relatedPropertyName] = args.constraints;
    const relatedValue = (args.object as any)[relatedPropertyName];
    return confirmNewPassword === relatedValue;
  }

  defaultMessage(args: ValidationArguments) {
    return 'New password and confirm password do not match';
  }
}

export class UpdatePasswordDto {
  @ApiProperty({
    example: 'CurrentP@ssw0rd123',
    description: 'Current password',
  })
  @IsString()
  @IsNotEmpty({ message: 'Current password is required' })
  currentPassword: string;

  @ApiProperty({
    example: 'NewP@ssw0rd123',
    description:
      'New password (minimum 8 characters, must contain uppercase, lowercase, number, and special character)',
  })
  @IsString()
  @IsNotEmpty({ message: 'New password is required' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message:
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)',
  })
  newPassword: string;

  @ApiProperty({
    example: 'NewP@ssw0rd123',
    description: 'Confirm new password (must match new password)',
  })
  @IsString()
  @IsNotEmpty({ message: 'Confirm password is required' })
  @Validate(MatchPasswordConstraint, ['newPassword'], {
    message: 'New password and confirm password do not match',
  })
  confirmNewPassword: string;
}













