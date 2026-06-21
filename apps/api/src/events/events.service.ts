import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

// ADR 0006 Data 렌즈: 활성화/퍼널/CAC 측정 원천. events 테이블에 유연 로그를 쌓는다.
// type 예시: signup / referral_click / referral_signup / activation_first_lecture /
//            paid_conversion / review_submitted / reward_granted
export interface EventInput {
  userId?: bigint | null;
  type: string;
  refTable?: string | null;
  refId?: bigint | null;
  props?: Record<string, unknown>;
}

@Injectable()
export class EventsService {
  constructor(private readonly prisma: PrismaService) {}

  // 단건 로그. 다른 서비스에서 주입해 호출하며, tx를 넘기면 같은 트랜잭션에 기록된다.
  log(input: EventInput, tx?: Prisma.TransactionClient) {
    const type = input.type?.trim();
    if (!type) throw new BadRequestException('type이 필요합니다');
    const client = tx ?? this.prisma;
    return client.events.create({
      data: {
        user_id: input.userId ?? null,
        type,
        ref_table: input.refTable ?? null,
        ref_id: input.refId ?? null,
        props: (input.props ?? {}) as Prisma.InputJsonValue,
      },
    });
  }

  // 퍼널 집계: type별 카운트(+ 코호트 한정은 선택). M1 활성화율/M2 후기·추천/M3 CAC 산출 기초.
  async funnel(cohortId?: bigint) {
    let userIds: bigint[] | undefined;
    if (cohortId != null) {
      const members = await this.prisma.cohort_members.findMany({
        where: { cohort_id: cohortId },
        select: { user_id: true },
      });
      userIds = members.map((m) => m.user_id);
      if (userIds.length === 0) {
        return { cohort_id: cohortId, total: 0, by_type: {} };
      }
    }
    const grouped = await this.prisma.events.groupBy({
      by: ['type'],
      where: userIds ? { user_id: { in: userIds } } : undefined,
      _count: { _all: true },
    });
    const by_type = grouped.reduce<Record<string, number>>((acc, g) => {
      acc[g.type] = g._count._all;
      return acc;
    }, {});
    const total = Object.values(by_type).reduce((a, b) => a + b, 0);
    return { cohort_id: cohortId ?? null, total, by_type };
  }
}
