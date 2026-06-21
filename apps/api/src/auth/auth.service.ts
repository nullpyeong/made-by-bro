import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { createHash, randomBytes } from 'crypto';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { EventsService } from '../events/events.service';
import { ReferralsService } from '../referrals/referrals.service';

// 세션 컨텍스트(기기/IP) — user_sessions 기록용.
export interface SessionCtx {
  device?: string;
  ip?: string;
}

const REFRESH_TTL_DAYS = 30;

function sha256(s: string): string {
  return createHash('sha256').update(s).digest('hex');
}

// 회원가입/로그인/세션(토큰) 발급·회전·폐기.
// 토큰 전략(ADR 0011): access=JWT(짧은 수명, stateless) + refresh=opaque 회전(user_sessions에 해시 저장).
@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventsService,
    private readonly referrals: ReferralsService,
    private readonly jwt: JwtService,
  ) {}

  /**
   * 회원가입 + 자동 로그인(토큰 발급).
   * - 유저 생성(bcrypt 해시) + signup 이벤트
   * - 추천코드가 있으면 best-effort 귀속(referral_signup 이벤트)
   *   잘못된/중복 코드여도 가입 자체는 막지 않는다(마찰 최소화) → referralWarning으로 알림.
   */
  async signup(
    input: {
      email?: unknown;
      password?: unknown;
      name?: unknown;
      referralCode?: unknown;
    },
    ctx: SessionCtx = {},
  ) {
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

    const tokens = await this.issueTokens(user.id, user.role, ctx);
    return { user: this.safe(user), referral, referralWarning, ...tokens };
  }

  /** 이메일+비밀번호 로그인 → 토큰 발급 + 세션 생성. */
  async login(emailRaw: unknown, passwordRaw: unknown, ctx: SessionCtx = {}) {
    const email = typeof emailRaw === 'string' ? emailRaw.trim() : '';
    const password = typeof passwordRaw === 'string' ? passwordRaw : '';
    if (!email || !password) {
      throw new BadRequestException('email과 password가 필요합니다');
    }
    const user = await this.prisma.users.findUnique({ where: { email } });
    // 사용자 없음/소셜전용(비번 NULL)/불일치 모두 동일 메시지(계정 존재 노출 방지).
    const ok =
      !!user && !!user.password && (await bcrypt.compare(password, user.password));
    if (!user || !ok) {
      throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다');
    }
    await this.events.log({ userId: user.id, type: 'login' });
    const tokens = await this.issueTokens(user.id, user.role, ctx);
    return { user: this.safe(user), ...tokens };
  }

  /**
   * refresh 토큰 회전. refreshToken = "<sessionId>.<secret>".
   * 세션 조회 → 해시 대조 → 만료 확인 → secret 회전(재사용 차단) → 새 access 발급.
   */
  async refresh(refreshToken: unknown, ctx: SessionCtx = {}) {
    const parsed = this.parseRefresh(refreshToken);
    if (!parsed) throw new UnauthorizedException('유효하지 않은 refresh 토큰');
    const session = await this.prisma.user_sessions.findUnique({
      where: { id: parsed.sessionId },
    });
    if (
      !session ||
      session.refresh_hash !== sha256(parsed.secret) ||
      session.expires_at <= new Date()
    ) {
      throw new UnauthorizedException('만료되었거나 폐기된 세션입니다');
    }
    const user = await this.prisma.users.findUnique({
      where: { id: session.user_id },
    });
    if (!user) throw new UnauthorizedException('사용자를 찾을 수 없습니다');

    const secret = randomBytes(32).toString('hex');
    await this.prisma.user_sessions.update({
      where: { id: session.id },
      data: {
        refresh_hash: sha256(secret),
        last_seen_at: new Date(),
        expires_at: this.refreshExpiry(),
        device: ctx.device ?? session.device,
        ip: ctx.ip ?? session.ip,
      },
    });
    const accessToken = this.signAccess(user.id, user.role);
    return {
      accessToken,
      refreshToken: `${session.id}.${secret}`,
      user: this.safe(user),
    };
  }

  /** 로그아웃 — 해당 세션 폐기(refresh 무효화). access는 짧은 수명으로 자연 만료. */
  async logout(refreshToken: unknown) {
    const parsed = this.parseRefresh(refreshToken);
    if (!parsed) return { ok: true };
    await this.prisma.user_sessions
      .delete({ where: { id: parsed.sessionId } })
      .catch(() => undefined); // 이미 없으면 무시(멱등)
    return { ok: true };
  }

  /** 현재 로그인 유저 정보(가드가 주입한 id 기준). */
  async me(userId: bigint) {
    const user = await this.prisma.users.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('사용자를 찾을 수 없습니다');
    return this.safe(user);
  }

  // ---- 내부 헬퍼 ----

  private async issueTokens(userId: bigint, role: string, ctx: SessionCtx) {
    const secret = randomBytes(32).toString('hex');
    const session = await this.prisma.user_sessions.create({
      data: {
        user_id: userId,
        refresh_hash: sha256(secret),
        device: ctx.device ?? null,
        ip: ctx.ip ?? null,
        expires_at: this.refreshExpiry(),
      },
    });
    return {
      accessToken: this.signAccess(userId, role),
      refreshToken: `${session.id}.${secret}`,
    };
  }

  private signAccess(userId: bigint, role: string): string {
    return this.jwt.sign({ sub: userId.toString(), role });
  }

  private parseRefresh(
    token: unknown,
  ): { sessionId: bigint; secret: string } | null {
    if (typeof token !== 'string' || !token.includes('.')) return null;
    const [idPart, secret] = token.split('.');
    if (!idPart || !secret) return null;
    try {
      return { sessionId: BigInt(idPart), secret };
    } catch {
      return null;
    }
  }

  private refreshExpiry(): Date {
    return new Date(Date.now() + REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000);
  }

  private safe<T extends { password?: unknown }>(user: T) {
    const { password: _pw, ...rest } = user;
    void _pw;
    return rest;
  }
}
