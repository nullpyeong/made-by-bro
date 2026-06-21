import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { EventsService } from '../events/events.service';
import { ReferralsService } from '../referrals/referrals.service';

// 회원가입 + 추천 귀속을 한 흐름으로 연결(ADR 0006). 기존 독립 /referrals/redeem을 가입에 통합.
@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventsService,
    private readonly referrals: ReferralsService,
  ) {}

  /**
   * - 유저 생성(bcrypt 해시) + signup 이벤트
   * - 추천코드가 있으면 best-effort 귀속(referral_signup 이벤트)
   *   잘못된/중복 코드여도 가입 자체는 막지 않는다(마찰 최소화) → referralWarning으로 알림.
   */
  async signup(input: {
    email?: unknown;
    password?: unknown;
    name?: unknown;
    referralCode?: unknown;
  }) {
    const email = typeof input.email === 'string' ? input.email.trim() : '';
    const password = typeof input.password === 'string' ? input.password : '';
    const name = typeof input.name === 'string' ? input.name.trim() : '';
    if (!email || !email.includes('@')) {
      throw new BadRequestException('유효한 email이 필요합니다');
    }
    if (password.length < 8) {
      throw new BadRequestException('비밀번호는 8자 이상이어야 합니다');
    }
    if (!name) throw new BadRequestException('name이 필요합니다');
    const referralCode =
      typeof input.referralCode === 'string' ? input.referralCode.trim() : '';

    const hash = await bcrypt.hash(password, 10);
    let user;
    try {
      user = await this.prisma.users.create({
        data: { email, password: hash, name },
      });
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        throw new ConflictException('이미 가입된 이메일입니다');
      }
      throw e;
    }
    await this.events.log({ userId: user.id, type: 'signup' });

    // 추천 귀속(선택, best-effort). 코드 오타로 가입을 막지 않는다.
    let referral: { id: bigint } | null = null;
    let referralWarning: string | null = null;
    if (referralCode) {
      try {
        referral = await this.referrals.redeem(referralCode, user.id);
        await this.events.log({
          userId: user.id,
          type: 'referral_signup',
          refTable: 'referral',
          refId: referral.id,
        });
      } catch (e) {
        referralWarning =
          e instanceof Error ? e.message : '추천 코드 귀속에 실패했습니다';
      }
    }

    const { password: _pw, ...safeUser } = user;
    void _pw;
    return { user: safeUser, referral, referralWarning };
  }
}
