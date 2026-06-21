import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { IS_PUBLIC_KEY } from './public.decorator';
import { AuthUser } from './current-user.decorator';

// 전역 가드(secure-by-default). @Public() 라우트만 익명 통과.
// Authorization: Bearer <accessToken(JWT)> 검증 후 req.user 주입.
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly reflector: Reflector,
  ) {}

  canActivate(ctx: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (isPublic) return true;

    const req = ctx
      .switchToHttp()
      .getRequest<{ headers: Record<string, string>; user?: AuthUser }>();
    const header = req.headers['authorization'] ?? '';
    const [scheme, token] = header.split(' ');
    if (scheme !== 'Bearer' || !token) {
      throw new UnauthorizedException('인증 토큰이 필요합니다');
    }
    try {
      const payload = this.jwt.verify<{ sub: string; role: string }>(token);
      req.user = { id: BigInt(payload.sub), role: payload.role };
      return true;
    } catch {
      throw new UnauthorizedException('유효하지 않거나 만료된 토큰입니다');
    }
  }
}
