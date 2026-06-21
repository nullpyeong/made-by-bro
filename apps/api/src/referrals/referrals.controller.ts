import { BadRequestException, Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ReferralsService } from './referrals.service';

// 인증 도입 전: userId를 파라미터/바디로 받는다(추후 세션 주입으로 교체).
function toUserId(v: unknown, field = 'userId'): bigint {
  try {
    return BigInt(v as string);
  } catch {
    throw new BadRequestException(`${field}가 올바르지 않습니다`);
  }
}

@Controller('referrals')
export class ReferralsController {
  constructor(private readonly referrals: ReferralsService) {}

  // 코드 발급(get-or-create).
  @Post('code')
  issueCode(@Body('userId') userId: unknown) {
    return this.referrals.issueCode(toUserId(userId));
  }

  // 코드 귀속(피추천자 가입).
  @Post('redeem')
  redeem(@Body('code') code: unknown, @Body('referredUserId') referredUserId: unknown) {
    if (typeof code !== 'string' || !code.trim()) {
      throw new BadRequestException('code가 필요합니다');
    }
    return this.referrals.redeem(code.trim(), toUserId(referredUserId, 'referredUserId'));
  }

  // 추천인 요약(내 코드 + 단계별 집계 + 목록).
  @Get(':userId')
  summary(@Param('userId') userId: string) {
    return this.referrals.summary(toUserId(userId));
  }
}
