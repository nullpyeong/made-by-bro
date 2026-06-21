import { createParamDecorator, ExecutionContext } from '@nestjs/common';

// 가드가 req.user에 주입한 인증 주체. id는 bigint(users.id).
export interface AuthUser {
  id: bigint;
  role: string;
}

// 컨트롤러에서 @CurrentUser()로 세션 유저를 꺼낸다(body userId 대체).
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUser => {
    const req = ctx.switchToHttp().getRequest<{ user?: AuthUser }>();
    return req.user as AuthUser;
  },
);
