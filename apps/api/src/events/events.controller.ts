import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Query,
} from '@nestjs/common';
import { EventsService } from './events.service';

// 인증 도입 전: userId는 바디/쿼리로 받는다(추후 세션 주입).
function toBigIntOpt(v: unknown, field: string): bigint | null {
  if (v == null || v === '') return null;
  try {
    return BigInt(v as string);
  } catch {
    throw new BadRequestException(`${field}가 올바르지 않습니다`);
  }
}

@Controller('events')
export class EventsController {
  constructor(private readonly events: EventsService) {}

  // 범용 퍼널 이벤트 로깅(referral_click·review_submitted 등).
  // 활성화는 보상 트리거가 걸려 있어 /rewards/activation 을 쓴다.
  @Post()
  log(
    @Body()
    body: {
      userId?: unknown;
      type?: unknown;
      refTable?: unknown;
      refId?: unknown;
      props?: Record<string, unknown>;
    },
  ) {
    if (typeof body?.type !== 'string' || !body.type.trim()) {
      throw new BadRequestException('type이 필요합니다');
    }
    return this.events.log({
      userId: toBigIntOpt(body.userId, 'userId'),
      type: body.type,
      refTable: typeof body.refTable === 'string' ? body.refTable : null,
      refId: toBigIntOpt(body.refId, 'refId'),
      props:
        body.props && typeof body.props === 'object' ? body.props : {},
    });
  }

  // 퍼널 집계(전체 또는 cohortId 한정).
  @Get('funnel')
  funnel(@Query('cohortId') cohortId?: string) {
    return this.events.funnel(toBigIntOpt(cohortId, 'cohortId') ?? undefined);
  }
}
