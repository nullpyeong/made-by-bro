import { Controller, Get, Param } from '@nestjs/common';
import { CoursesService } from './courses.service';
import { Public } from '../auth/public.decorator';

@Controller('courses')
export class CoursesController {
  constructor(private readonly courses: CoursesService) {}

  // 랜딩/카탈로그는 비로그인 공개.
  @Public()
  @Get()
  list() {
    return this.courses.findPublished();
  }

  // 커리큘럼(섹션→강의, 실제 DB id) — 플레이어 리얼 모드 구동. 미리보기용 공개.
  @Public()
  @Get(':id/curriculum')
  curriculum(@Param('id') id: string) {
    return this.courses.getCurriculum(id);
  }
}
