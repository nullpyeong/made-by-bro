import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';

// ADR 0006 추천 엔진. 1인 1코드, 피추천자는 1회만(referred_user_id UNIQUE), 본인 코드 금지.
// 인증 도입 전이라 userId는 호출자가 넘긴다(추후 세션에서 주입). 보상 지급은 별도 후속.
@Injectable()
export class ReferralsService {
  constructor(private readonly prisma: PrismaService) {}

  private static isUniqueViolation(e: unknown): boolean {
    return (
      e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002'
    );
  }

  // 코드 발급(get-or-create). 이미 있으면 그대로 반환.
  async issueCode(userId: bigint) {
    const existing = await this.prisma.referral_codes.findUnique({
      where: { user_id: userId },
    });
    if (existing) return existing;

    const user = await this.prisma.users.findUnique({ where: { id: userId } });
    if (!user) throw new BadRequestException('존재하지 않는 사용자입니다');

    for (let i = 0; i < 5; i++) {
      const code = 'BRO-' + randomBytes(4).toString('hex').toUpperCase().slice(0, 6);
      try {
        return await this.prisma.referral_codes.create({
          data: { user_id: userId, code },
        });
      } catch (e) {
        if (ReferralsService.isUniqueViolation(e)) continue; // 코드 충돌 → 재시도
        throw e;
      }
    }
    throw new ConflictException('추천 코드 생성에 실패했습니다');
  }

  // 코드로 추천 귀속(피추천자 가입 시 1회). DB UNIQUE가 중복/재추천을 막는다.
  async redeem(code: string, referredUserId: bigint) {
    const rc = await this.prisma.referral_codes.findUnique({ where: { code } });
    if (!rc || !rc.is_active) {
      throw new BadRequestException('유효하지 않은 추천 코드입니다');
    }
    if (rc.user_id === referredUserId) {
      throw new BadRequestException('본인 추천 코드는 사용할 수 없습니다');
    }
    try {
      return await this.prisma.referrals.create({
        data: {
          code_id: rc.id,
          referrer_user_id: rc.user_id,
          referred_user_id: referredUserId,
          status: 'signed_up',
        },
      });
    } catch (e) {
      if (ReferralsService.isUniqueViolation(e)) {
        throw new ConflictException('이미 추천을 통해 가입한 사용자입니다');
      }
      throw e;
    }
  }

  // 추천인 요약: 내 코드 + 단계별 집계 + 목록(0006 "상위 추천인 식별"의 기초).
  async summary(userId: bigint) {
    const code = await this.prisma.referral_codes.findUnique({
      where: { user_id: userId },
    });
    const referrals = await this.prisma.referrals.findMany({
      where: { referrer_user_id: userId },
      orderBy: { created_at: 'desc' },
    });
    const byStatus = referrals.reduce<Record<string, number>>((acc, r) => {
      acc[r.status] = (acc[r.status] ?? 0) + 1;
      return acc;
    }, {});
    return {
      code: code?.code ?? null,
      total: referrals.length,
      by_status: byStatus,
      referrals,
    };
  }
}
