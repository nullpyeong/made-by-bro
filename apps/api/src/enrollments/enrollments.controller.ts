import { Controller, Get } from '@nestjs/common';
import { EnrollmentsService } from './enrollments.service';
import { CurrentUser, AuthUser } from '../auth/current-user.decorator';

// 내 학습 허브(마이페이지) — 전역 JwtAuthGuard로 보호(로그인 필수).
@Controller('me')
export class EnrollmentsController {
  constructor(private readonly enrollments: EnrollmentsService) {}

  // 내 수강목록 + 코스별 진도율. 세션 유저 기준.
  @Get('enrollments')
  list(@CurrentUser() user: AuthUser) {
    return this.enrollments.listForUser(user.id);
  }
}
