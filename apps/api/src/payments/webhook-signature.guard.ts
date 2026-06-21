import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import * as crypto from 'crypto';

// 결제 웹훅 서명 검증 가드(ADR 0013, fail-closed).
// 원문 바디(req.rawBody)에 HMAC-SHA256(secret)을 계산해 서명 헤더와 timing-safe 비교한다.
//
// ⚠️ Toss의 정확한 서명 사양(헤더명·인코딩)은 연동 시 공식 문서로 확정해야 한다(ADR 0013 유보).
//   그래서 헤더명/인코딩을 env로 바꿀 수 있게 했다:
//     TOSS_WEBHOOK_SECRET       (필수) — 미설정 시 모든 웹훅 거부(fail-closed)
//     TOSS_WEBHOOK_SIG_HEADER   (기본 'tosspayments-webhook-signature')
//     TOSS_WEBHOOK_SIG_ENCODING (기본 'base64' | 'hex')
@Injectable()
export class WebhookSignatureGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest<{
      headers: Record<string, string | undefined>;
      rawBody?: Buffer;
    }>();

    const secret = process.env.TOSS_WEBHOOK_SECRET;
    // fail-closed: 시크릿이 없으면 검증 불가 → 무조건 거부(잘못 열리는 사고 방지).
    if (!secret) {
      throw new UnauthorizedException('웹훅 시크릿 미설정');
    }

    const headerName = (
      process.env.TOSS_WEBHOOK_SIG_HEADER ?? 'tosspayments-webhook-signature'
    ).toLowerCase();
    const encoding = (
      process.env.TOSS_WEBHOOK_SIG_ENCODING ?? 'base64'
    ) as crypto.BinaryToTextEncoding;

    const provided = req.headers[headerName];
    const raw = req.rawBody;
    if (!provided || !raw || raw.length === 0) {
      throw new UnauthorizedException('서명 또는 원문 바디 없음');
    }

    const expected = crypto
      .createHmac('sha256', secret)
      .update(raw)
      .digest(encoding);

    const a = Buffer.from(provided);
    const b = Buffer.from(expected);
    // 길이가 다르면 timingSafeEqual이 throw → 길이부터 체크(역시 거부).
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
      throw new UnauthorizedException('서명 불일치');
    }
    return true;
  }
}
