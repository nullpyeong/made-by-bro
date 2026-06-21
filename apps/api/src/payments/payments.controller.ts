import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { Public } from '../auth/public.decorator';
import { WebhookSignatureGuard } from './webhook-signature.guard';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  // 토스 결제 웹훅 수신(ADR 0003/0013).
  // @Public(): 사용자 JWT가 아니라 서버-서버 호출이므로 전역 JwtAuthGuard 우회.
  // 대신 WebhookSignatureGuard(HMAC 서명, fail-closed)로 인증한다.
  @Public()
  @UseGuards(WebhookSignatureGuard)
  @Post('webhook/toss')
  tossWebhook(@Body() body: unknown) {
    return this.payments.handleTossWebhook(body ?? {});
  }
}
