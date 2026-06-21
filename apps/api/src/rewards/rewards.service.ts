import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { EventsService } from '../events/events.service';

// ADR 0006 보상 정책(확정): 비현금만. 피추천자 활성화(첫 강의 수강) → 추천인에게 무료기간 30일 연장.
const REFERRAL_REWARD = { kind: 'sub_extension' as const, amount: 30 };

@Injectable()
export class RewardsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventsService,
  ) {}

  // 내 보상 목록(추천인 대시보드).
  listForUser(userId: bigint) {
    return this.prisma.rewards.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
    });
  }

  /**
   * 피추천자 활성화(첫 강의 수강) 기록 → 추천인 보상 트리거.
   * - activation_first_lecture 이벤트 로깅
   * - 추천받아 가입했고 아직 활성화 전이면 referral.status → activated
   * - 추천인에게 보상 1건 지급(referral당 1회, 멱등)
   * 활성화/보상/이벤트를 한 트랜잭션으로 묶는다.
   */
  recordActivation(userId: bigint) {
    return this.prisma.$transaction(async (tx) => {
      await this.events.log(
        {
          userId,
          type: 'activation_first_lecture',
          refTable: 'user',
          refId: userId,
        },
        tx,
      );
      const referral = await tx.referrals.findUnique({
        where: { referred_user_id: userId },
      });
      if (!referral) {
        return { activated: true, referral_id: null, reward: null };
      }
      if (referral.status === 'signed_up' || referral.status === 'pending') {
        await tx.referrals.update({
          where: { id: referral.id },
          data: { status: 'activated' },
        });
      }
      const reward = await this.grantReferralReward(referral.id, tx);
      return { activated: true, referral_id: referral.id, reward };
    });
  }

  /**
   * 추천 보상 지급(멱등). 같은 referral에 같은 종류 보상이 이미 있으면 그대로 반환(중복 지급 차단).
   * 비현금(연장 30일), 즉시 granted. 트랜잭션 클라이언트(tx) 안에서 호출.
   */
  async grantReferralReward(referralId: bigint, tx: Prisma.TransactionClient) {
    const referral = await tx.referrals.findUnique({
      where: { id: referralId },
    });
    if (!referral) throw new NotFoundException('추천 내역을 찾을 수 없습니다');

    const existing = await tx.rewards.findFirst({
      where: { referral_id: referralId, kind: REFERRAL_REWARD.kind },
    });
    if (existing) return existing; // 멱등

    const reward = await tx.rewards.create({
      data: {
        user_id: referral.referrer_user_id, // 보상 수령자 = 추천인
        referral_id: referralId,
        kind: REFERRAL_REWARD.kind,
        amount: REFERRAL_REWARD.amount,
        status: 'granted',
        granted_at: new Date(),
        note: '피추천자 활성화 보상(무료 30일 연장)',
      },
    });
    await this.events.log(
      {
        userId: referral.referrer_user_id,
        type: 'reward_granted',
        refTable: 'reward',
        refId: reward.id,
        props: { kind: reward.kind, amount: reward.amount },
      },
      tx,
    );
    return reward;
  }

  // 관리자/수동 보상 지급(자체 트랜잭션 래핑).
  grantManual(referralId: bigint) {
    return this.prisma.$transaction((tx) =>
      this.grantReferralReward(referralId, tx),
    );
  }

  /**
   * 피추천자 유료 전환 기록(CAC 귀속). referral.status → converted + converted_payment_id.
   * 보상과 별개 경로 — 활성화는 보상, 전환은 CAC 측정.
   */
  recordConversion(userId: bigint, paymentId?: bigint) {
    return this.prisma.$transaction(async (tx) => {
      await this.events.log(
        {
          userId,
          type: 'paid_conversion',
          refTable: paymentId ? 'payment' : null,
          refId: paymentId ?? null,
        },
        tx,
      );
      const referral = await tx.referrals.findUnique({
        where: { referred_user_id: userId },
      });
      if (!referral) return { converted: true, referral_id: null };
      const updated = await tx.referrals.update({
        where: { id: referral.id },
        data: {
          status: 'converted',
          converted_payment_id: paymentId ?? referral.converted_payment_id,
        },
      });
      return { converted: true, referral_id: updated.id };
    });
  }

  // 지급된 보상 사용 처리(구독 연장 등에 적용 시 granted → redeemed).
  async redeemReward(rewardId: bigint) {
    const reward = await this.prisma.rewards.findUnique({
      where: { id: rewardId },
    });
    if (!reward) throw new NotFoundException('보상을 찾을 수 없습니다');
    if (reward.status !== 'granted') {
      throw new BadRequestException('지급(granted) 상태의 보상만 사용할 수 있습니다');
    }
    return this.prisma.rewards.update({
      where: { id: rewardId },
      data: { status: 'redeemed', redeemed_at: new Date() },
    });
  }
}
