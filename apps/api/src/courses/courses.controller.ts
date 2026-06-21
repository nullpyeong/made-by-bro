import { Controller, Get } from '@nestjs/common';
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
}
