import { Body, Controller, Get, Post, Query, Req } from '@nestjs/common';
import type { Request } from 'express';
import { AuthService, SessionCtx } from './auth.service';
import { Public } from './public.decorator';
import { CurrentUser, AuthUser } from './current-user.decorator';

// 요청에서 세션 컨텍스트(기기/IP) 추출 — user_sessions 기록용.
function sessionCtx(req: Request): SessionCtx {
  return {
    device: (req.headers['user-agent'] ?? '').toString().slice(0, 200),
    ip: (req.ip ?? req.socket?.remoteAddress ?? '').slice(0, 64),
  };
}

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  // 회원가입(+ 선택적 추천코드 귀속) + 자동 로그인(토큰 발급).
  @Public()
  @Post('signup')
  signup(@Body() body: unknown, @Req() req: Request) {
    return this.auth.signup(
      (body ?? {}) as Record<string, unknown>,
      sessionCtx(req),
    );
  }

  // 로그인(email+password) → access/refresh 토큰.
  @Public()
  @Post('login')
  login(
    @Body('email') email: unknown,
    @Body('password') password: unknown,
    @Req() req: Request,
  ) {
    return this.auth.login(email, password, sessionCtx(req));
  }

  // refresh 토큰 회전 → 새 access/refresh.
  @Public()
  @Post('refresh')
  refresh(@Body('refreshToken') refreshToken: unknown, @Req() req: Request) {
    return this.auth.refresh(refreshToken, sessionCtx(req));
  }

  // 로그아웃 — 세션 폐기(멱등).
  @Public()
  @Post('logout')
  logout(@Body('refreshToken') refreshToken: unknown) {
    return this.auth.logout(refreshToken);
  }

  // 카카오 인가 URL 발급(프론트가 이 URL로 리다이렉트).
  @Public()
  @Get('kakao')
  kakaoAuthorize(@Query('state') state?: string) {
    return { url: this.auth.kakaoAuthorizeUrl(state) };
  }

  // 카카오 로그인 — 인가코드(code) → 토큰. 신규/기존 모두 처리.
  @Public()
  @Post('kakao')
  kakaoLogin(@Body('code') code: unknown, @Req() req: Request) {
    return this.auth.loginWithKakao(code, sessionCtx(req));
  }

  // 현재 로그인 유저(가드 필요).
  @Get('me')
  me(@CurrentUser() user: AuthUser) {
    return this.auth.me(user.id);
  }
}
