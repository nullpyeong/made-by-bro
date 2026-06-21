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
import { KakaoService, KakaoProfile } from './kakao.service';

// 세션 컨텍스트(기기/IP) — user_sessions 기록용.
export interface SessionCtx {
  device?: string;
  ip?: string;
}

const REFRESH_TTL_DAYS = 30;
// 계정당 동시 활성 세션(기기) 한도. 초과 시 가장 오래된 세션부터 폐기(schema.sql NOTE).
const MAX_ACTIVE_SESSIONS = Number(process.env.MAX_ACTIVE_SESSIONS ?? 2);

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
    private readonly kakao: KakaoService,
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

  /** 프론트가 사용자를 보낼 카카오 인가 URL. */
  kakaoAuthorizeUrl(state?: string): string {
    return this.kakao.authorizeUrl(state);
  }

  /**
   * 카카오 로그인 — 인가코드(code) → 프로필 조회 → 유저 upsert → 토큰 발급.
   * 신규면 signup, 기존이면 login 이벤트.
   */
  async loginWithKakao(codeRaw: unknown, ctx: SessionCtx = {}) {
    const code = typeof codeRaw === 'string' ? codeRaw.trim() : '';
    if (!code) throw new BadRequestException('인가 코드(code)가 필요합니다');
    const profile = await this.kakao.fetchProfile(code);
    const { user, created } = await this.upsertKakaoUser(profile);
    await this.events.log({ userId: user.id, type: created ? 'signup' : 'login' });
    const tokens = await this.issueTokens(user.id, user.role, ctx);
    return { user: this.safe(user), created, ...tokens };
  }

  /**
   * 카카오 프로필 → 유저 매핑.
   *  1) kakao_id 일치 = 기존 소셜 계정
   *  2) (검증된)이메일 일치 = 기존 계정에 카카오 연결(계정 통합)
   *  3) 없으면 신규 소셜 계정 생성(비번 NULL). 이메일 없으면 합성 이메일.
   */
  private async upsertKakaoUser(profile: KakaoProfile) {
    const byKakao = await this.prisma.users.findFirst({
      where: { kakao_id: profile.kakaoId },
    });
    if (byKakao) return { user: byKakao, created: false };

    if (profile.email) {
      const byEmail = await this.prisma.users.findUnique({
        where: { email: profile.email },
      });
      if (byEmail) {
        const linked = await this.prisma.users.update({
          where: { id: byEmail.id },
          data: {
            kakao_id: profile.kakaoId,
            profile_image: byEmail.profile_image ?? profile.profileImage,
          },
        });
        return { user: linked, created: false };
      }
    }

    const email = profile.email ?? `kakao_${profile.kakaoId}@kakao.local`;
    try {
      const created = await this.prisma.users.create({
        data: {
          email,
          password: null, // 소셜 전용 계정
          name: profile.name,
          kakao_id: profile.kakaoId,
          profile_image: profile.profileImage,
        },
      });
      return { user: created, created: true };
    } catch (e) {
      // 동시 가입 경쟁 등으로 kakao_id가 막 생긴 경우 한 번 더 조회.
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        const again = await this.prisma.users.findFirst({
          where: { kakao_id: profile.kakaoId },
        });
        if (again) return { user: again, created: false };
      }
      throw e;
    }
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
    await this.enforceSessionLimit(userId);
    return {
      accessToken: this.signAccess(userId, role),
      refreshToken: `${session.id}.${secret}`,
    };
  }

  /**
   * 활성 세션 수 제한(기본 2기기) — 계정공유 방지.
   * 만료 세션 정리 후, 한도 초과분을 가장 오래된(last_seen_at) 순으로 폐기.
   * 방금 만든 세션은 last_seen_at=now 라 항상 살아남는다.
   */
  private async enforceSessionLimit(userId: bigint) {
    if (!Number.isFinite(MAX_ACTIVE_SESSIONS) || MAX_ACTIVE_SESSIONS < 1) return;
    await this.prisma.user_sessions.deleteMany({
      where: { user_id: userId, expires_at: { lte: new Date() } },
    });
    const active = await this.prisma.user_sessions.findMany({
      where: { user_id: userId },
      orderBy: { last_seen_at: 'desc' },
      select: { id: true },
    });
    if (active.length > MAX_ACTIVE_SESSIONS) {
      const evict = active.slice(MAX_ACTIVE_SESSIONS).map((s) => s.id);
      await this.prisma.user_sessions.deleteMany({
        where: { id: { in: evict } },
      });
    }
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
