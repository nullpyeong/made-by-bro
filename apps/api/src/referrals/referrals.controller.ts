import { BadRequestException, Body, Controller, Get, Post } from '@nestjs/common';
import { ReferralsService } from './referrals.service';
import { CurrentUser, AuthUser } from '../auth/current-user.decorator';

@Controller('referrals')
export class ReferralsController {
  constructor(private readonly referrals: ReferralsService) {}

  // 내 추천코드 발급(get-or-create). 세션 유저 기준.
  @Post('code')
  issueCode(@CurrentUser() user: AuthUser) {
    return this.referrals.issueCode(user.id);
  }

  // 추천코드 귀속 — 피추천자 = 로그인한 본인(세션). 가입 흐름은 /auth/signup이 내부 처리.
  @Post('redeem')
  redeem(@CurrentUser() user: AuthUser, @Body('code') code: unknown) {
    if (typeof code !== 'string' || !code.trim()) {
      throw new BadRequestException('code가 필요합니다');
    }
    return this.referrals.redeem(code.trim(), user.id);
  }

  // 내 추천 요약(코드 + 단계별 집계 + 목록).
  @Get('me')
  summary(@CurrentUser() user: AuthUser) {
    return this.referrals.summary(user.id);
  }
}
