import { IsString, IsNotEmpty } from 'class-validator';

export class GoogleLoginDto {
  @IsString()
  @IsNotEmpty()
  accessToken: string;
}

export class FacebookLoginDto {
  @IsString()
  @IsNotEmpty()
  accessToken: string;
}

