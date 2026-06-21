import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  // 회원가입(+ 선택적 추천코드 귀속).
  @Post('signup')
  signup(@Body() body: unknown) {
    return this.auth.signup((body ?? {}) as Record<string, unknown>);
  }
}
