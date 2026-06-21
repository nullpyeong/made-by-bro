import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// 카카오에서 받아온 정규화된 프로필.
export interface KakaoProfile {
  kakaoId: string;
  email: string | null; // 검증된 이메일만(미검증/미동의는 null)
  name: string;
  profileImage: string | null;
}

// 카카오 OAuth: 인가코드 → 토큰 → 프로필 조회.
// 엔드포인트 URL은 ConfigService로 오버라이드 가능(테스트 시 mock 서버로 교체).
@Injectable()
export class KakaoService {
  constructor(private readonly cfg: ConfigService) {}

  // REST API 키가 있어야 카카오 로그인 활성.
  get isConfigured(): boolean {
    return !!this.cfg.get<string>('KAKAO_REST_API_KEY');
  }

  // 프론트가 사용자를 보낼 카카오 인가(authorize) URL.
  authorizeUrl(state?: string): string {
    const base =
      this.cfg.get<string>('KAKAO_AUTHORIZE_URL') ??
      'https://kauth.kakao.com/oauth/authorize';
    const params = new URLSearchParams({
      client_id: this.required('KAKAO_REST_API_KEY'),
      redirect_uri: this.required('KAKAO_REDIRECT_URI'),
      response_type: 'code',
    });
    if (state) params.set('state', state);
    return `${base}?${params.toString()}`;
  }

  // 인가코드로 access token 교환 후 프로필 조회.
  async fetchProfile(code: string): Promise<KakaoProfile> {
    const accessToken = await this.exchangeCode(code);
    return this.fetchUser(accessToken);
  }

  private async exchangeCode(code: string): Promise<string> {
    const url =
      this.cfg.get<string>('KAKAO_TOKEN_URL') ??
      'https://kauth.kakao.com/oauth/token';
    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: this.required('KAKAO_REST_API_KEY'),
      redirect_uri: this.required('KAKAO_REDIRECT_URI'),
      code,
    });
    const secret = this.cfg.get<string>('KAKAO_CLIENT_SECRET');
    if (secret) body.set('client_secret', secret);

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
      },
      body,
    });
    if (!res.ok) {
      throw new UnauthorizedException('카카오 토큰 교환에 실패했습니다');
    }
    const json = (await res.json()) as { access_token?: string };
    if (!json.access_token) {
      throw new UnauthorizedException('카카오 access_token이 없습니다');
    }
    return json.access_token;
  }

  private async fetchUser(accessToken: string): Promise<KakaoProfile> {
    const url =
      this.cfg.get<string>('KAKAO_USERINFO_URL') ??
      'https://kapi.kakao.com/v2/user/me';
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) {
      throw new UnauthorizedException('카카오 사용자 조회에 실패했습니다');
    }
    const json = (await res.json()) as {
      id?: number | string;
      kakao_account?: {
        email?: string;
        is_email_verified?: boolean;
        profile?: { nickname?: string; profile_image_url?: string };
      };
    };
    if (json.id === undefined || json.id === null) {
      throw new UnauthorizedException('카카오 사용자 id가 없습니다');
    }
    const account = json.kakao_account ?? {};
    // 보안: 미검증 이메일로 기존 계정에 연결하면 계정 탈취 위험 → 검증된 이메일만 사용.
    const verifiedEmail =
      account.is_email_verified === true && account.email
        ? account.email
        : null;
    return {
      kakaoId: String(json.id),
      email: verifiedEmail,
      name: account.profile?.nickname?.trim() || '카카오사용자',
      profileImage: account.profile?.profile_image_url ?? null,
    };
  }

  private required(key: string): string {
    const v = this.cfg.get<string>(key);
    if (!v) {
      throw new BadRequestException(`${key} 미설정 — 카카오 로그인 비활성`);
    }
    return v;
  }
}
