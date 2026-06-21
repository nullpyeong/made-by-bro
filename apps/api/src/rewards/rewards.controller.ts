import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
} from '@nestjs/common';
import { RewardsService } from './rewards.service';

// 인증 도입 전: id는 파라미터/바디로 받는다(추후 세션 주입).
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

  // 피추천자 활성화 기록(첫 강의 수강) → 추천인 보상 트리거.
  @Post('activation')
  activation(@Body('userId') userId: unknown) {
    return this.rewards.recordActivation(toId(userId, 'userId'));
  }

  // 피추천자 유료 전환 기록(CAC).
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
  @Post('grant')
  grant(@Body('referralId') referralId: unknown) {
    return this.rewards.grantManual(toId(referralId, 'referralId'));
  }

  // 보상 사용 처리(granted → redeemed).
  @Post(':id/redeem')
  redeem(@Param('id') id: string) {
    return this.rewards.redeemReward(toId(id, 'id'));
  }

  // 내 보상 목록(추천인 대시보드).
  @Get(':userId')
  list(@Param('userId') userId: string) {
    return this.rewards.listForUser(toId(userId, 'userId'));
  }
}
