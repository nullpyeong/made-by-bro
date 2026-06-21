import { Controller, Post, Get, Body, Param, Query } from '@nestjs/common';
import { ProgressService, SaveProgressInput } from './progress.service';
import { CurrentUser, AuthUser } from '../auth/current-user.decorator';

// 학습 진도 — 전역 JwtAuthGuard로 보호(로그인 필수), 세션 유저 본인 기준.
@Controller('me/progress')
export class ProgressController {
  constructor(private readonly progress: ProgressService) {}

  // 진도 저장(upsert). 플레이어가 재생/완청 시 호출. 멱등.
  @Post()
  save(@CurrentUser() user: AuthUser, @Body() body: SaveProgressInput) {
    return this.progress.save(user.id, body);
  }

  // 코스 1개의 내 진도 목록 — 재생목록 체크표시·이어보기용. ?courseId=<id>.
  @Get()
  listForCourse(
    @CurrentUser() user: AuthUser,
    @Query('courseId') courseId: string,
  ) {
    return this.progress.listForCourse(user.id, courseId);
  }

  // 이어보기 복원 — 해당 강의 진도(없으면 0 기본).
  @Get(':lectureId')
  getOne(@CurrentUser() user: AuthUser, @Param('lectureId') lectureId: string) {
    return this.progress.getOne(user.id, lectureId);
  }
}
