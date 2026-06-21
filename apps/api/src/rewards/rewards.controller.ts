import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { RewardsService } from './rewards.service';
import { CurrentUser, AuthUser } from '../auth/current-user.decorator';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

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

  // --- 아래는 관리자/운영 전용 (ADR 0011/0013). 전역 JwtAuthGuard + RolesGuard('admin') ---
  // 자동 전환(CAC)은 결제 웹훅(POST /payments/webhook/toss)이 서명 검증 후
  // RewardsService.recordConversion을 직접 호출한다. 아래 conversion 엔드포인트는 수동 백필/운영용.

  // 피추천자 유료 전환 기록(CAC) — 관리자 수동 백필.
  @Roles('admin')
  @UseGuards(RolesGuard)
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
  @Roles('admin')
  @UseGuards(RolesGuard)
  @Post('grant')
  grant(@Body('referralId') referralId: unknown) {
    return this.rewards.grantManual(toId(referralId, 'referralId'));
  }

  // 보상 사용 처리(granted → redeemed) — 구독 연장 적용(시스템/관리자).
  @Roles('admin')
  @UseGuards(RolesGuard)
  @Post(':id/redeem')
  redeem(@Param('id') id: string) {
    return this.rewards.redeemReward(toId(id, 'id'));
  }
}
