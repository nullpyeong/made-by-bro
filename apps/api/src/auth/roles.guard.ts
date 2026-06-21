import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './roles.decorator';
import { AuthUser } from './current-user.decorator';

// 관리자/권한 가드. 전역 JwtAuthGuard 뒤에 라우트 단위로 건다(@UseGuards(RolesGuard)).
// JwtAuthGuard가 먼저 req.user(=AuthUser)를 채우므로 여기선 role만 검사한다.
// @Roles(...)가 없는 라우트는 통과(권한 제약 없음).
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (!required || required.length === 0) return true;

    const req = ctx.switchToHttp().getRequest<{ user?: AuthUser }>();
    const user = req.user;
    // 전역 가드를 통과했다면 user는 있어야 한다(@Public 라우트에 @Roles를 달지 않는다).
    if (!user) throw new UnauthorizedException('인증이 필요합니다');
    if (!required.includes(user.role)) {
      throw new ForbiddenException('접근 권한이 없습니다');
    }
    return true;
  }
}
