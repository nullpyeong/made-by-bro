import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RewardsService } from '../rewards/rewards.service';
import { EventsService } from '../events/events.service';

// Toss 웹훅에서 결제 "완료"로 간주하는 상태값(연동 시 문서로 확정 — ADR 0013 유보).
const DONE_STATUSES = new Set(['DONE', 'PAID', 'COMPLETED']);

type WebhookBody = {
  eventType?: unknown;
  data?: { paymentKey?: unknown; orderId?: unknown; status?: unknown };
  // 평탄한 형태도 방어적으로 수용
  paymentKey?: unknown;
  status?: unknown;
};

@Injectable()
export class PaymentsService {
  private readonly log = new Logger('PaymentsService');

  constructor(
    private readonly prisma: PrismaService,
    private readonly rewards: RewardsService,
    private readonly events: EventsService,
  ) {}

  /**
   * 서명 검증을 통과한 Toss 웹훅 처리.
   * - paymentKey(=payments.pg_tid)로 결제 건을 찾는다.
   * - 완료 상태면 payments.status → paid (멱등: 이미 paid면 skip).
   * - 새로 paid가 된 건이면 추천인 유료 전환(CAC)을 자동 기록.
   * 결제 생성(checkout) 플로우는 후속이라, 지금은 사전 생성된 결제 row를 확정하는 경로다.
   */
  async handleTossWebhook(body: WebhookBody) {
    const paymentKey = str(body?.data?.paymentKey ?? body?.paymentKey);
    const status = str(body?.data?.status ?? body?.status);

    if (!paymentKey) {
      // 서명은 맞지만 식별 불가 — 200 ack(재시도 폭주 방지)하되 처리 안 함.
      this.log.warn('웹훅에 paymentKey 없음');
      return { received: true, matched: false, reason: 'no_payment_key' };
    }

    const payment = await this.prisma.payments.findFirst({
      where: { pg_provider: 'toss', pg_tid: paymentKey },
    });
    if (!payment) {
      this.log.warn(`매칭되는 결제 없음: ${paymentKey}`);
      return { received: true, matched: false, reason: 'payment_not_found' };
    }

    if (!status || !DONE_STATUSES.has(status.toUpperCase())) {
      // 완료 외 상태(취소 등)는 이번 범위 밖 — ack만.
      return {
        received: true,
        matched: true,
        payment_id: payment.id,
        applied: false,
        reason: `status_${status ?? 'unknown'}`,
      };
    }

    // 멱등: status != 'paid' 인 건만 paid로 전이. 이미 paid면 count=0 → conversion 재실행 안 함.
    const flipped = await this.prisma.payments.updateMany({
      where: { id: payment.id, status: { not: 'paid' } },
      data: { status: 'paid', paid_at: new Date() },
    });

    if (flipped.count === 0) {
      return {
        received: true,
        matched: true,
        payment_id: payment.id,
        applied: false,
        reason: 'already_paid',
      };
    }

    await this.events.log({
      userId: payment.user_id,
      type: 'payment_confirmed',
      refTable: 'payment',
      refId: payment.id,
      props: { pg_tid: paymentKey, amount: payment.amount },
    });

    // 추천 유료 전환(CAC) 자동 연결 — 추천받아 가입한 유저면 referral.status → converted.
    const conversion = await this.rewards.recordConversion(
      payment.user_id,
      payment.id,
    );

    return {
      received: true,
      matched: true,
      payment_id: payment.id,
      applied: true,
      conversion,
    };
  }
}

function str(v: unknown): string | null {
  return typeof v === 'string' && v.trim() ? v : null;
}
