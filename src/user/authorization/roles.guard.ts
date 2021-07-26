import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    if (user && user.roles === 'admin') return true;
    throw new HttpException('Unauthorized!!!', HttpStatus.UNAUTHORIZED);
  }
}
