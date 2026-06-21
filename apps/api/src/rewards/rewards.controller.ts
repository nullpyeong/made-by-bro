import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
} from '@nestjs/common';
import { RewardsService } from './rewards.service';
import { Public } from '../auth/public.decorator';
import { CurrentUser, AuthUser } from '../auth/current-user.decorator';

function toId(v: unknown, field: string): bigint {
  try {
    return BigInt(v as string);
  } catch {
    throw new BadRequestException(`${field}가 올바르지 않습니다`);
  }
}

function toIdOpt(v: unknown, field: string): bigint | undefined {
  if (v == null || v === '') return undefined;
  return toId(v, field);
}

@Controller('rewards')
export class RewardsController {
  constructor(private readonly rewards: RewardsService) {}

  // 내 활성화 기록(첫 강의 수강) → 추천인 보상 트리거. 세션 유저 기준.
  // 추후 플레이어가 첫 재생 시 본인 토큰으로 호출 → 실제 수강 이벤트와 자동 연결.
  @Post('activation')
  activation(@CurrentUser() user: AuthUser) {
    return this.rewards.recordActivation(user.id);
  }

  // 내 보상 목록(추천인 대시보드). 세션 유저 기준.
  @Get('me')
  list(@CurrentUser() user: AuthUser) {
    return this.rewards.listForUser(user.id);
  }

  // --- 아래는 서버/관리자 트리거(결제 웹훅·운영). 세션이 아닌 별도 인증 필요 ---
  // TODO(ADR 0011 후속): 결제 웹훅 서명/관리자 role 가드로 보호. 현재는 임시 공개.

  // 피추천자 유료 전환 기록(CAC) — 결제 확정 후 서버가 호출.
  @Public()
  @Post('conversion')
  conversion(
    @Body('userId') userId: unknown,
    @Body('paymentId') paymentId: unknown,
  ) {
    return this.rewards.recordConversion(
      toId(userId, 'userId'),
      toIdOpt(paymentId, 'paymentId'),
    );
  }

  // 수동/관리자 보상 지급.
  @Public()
  @Post('grant')
  grant(@Body('referralId') referralId: unknown) {
    return this.rewards.grantManual(toId(referralId, 'referralId'));
  }

  // 보상 사용 처리(granted → redeemed) — 구독 연장 적용 시.
  @Public()
  @Post(':id/redeem')
  redeem(@Param('id') id: string) {
    return this.rewards.redeemReward(toId(id, 'id'));
  }
}
