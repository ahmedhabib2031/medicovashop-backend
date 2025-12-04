import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class RefreshTokenGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const refreshToken = req.headers['x-refresh-token'];
    if (!refreshToken) throw new UnauthorizedException('Refresh token missing');

    req.refreshToken = refreshToken;
    return true;
  }
}
