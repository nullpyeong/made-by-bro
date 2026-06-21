import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CoursesService {
  constructor(private readonly prisma: PrismaService) {}

  // 공개된 코스 목록.
  findPublished() {
    return this.prisma.courses.findMany({
      where: { status: 'published' },
      orderBy: { created_at: 'desc' },
    });
  }

  // 코스 1개의 커리큘럼 — 섹션(순서) → 강의(순서)를 실제 DB id로 반환.
  // 플레이어 리얼 모드가 이걸 받아 실제 lectures.id로 재생목록·본문을 렌더하고,
  // 그 id로 진도(/me/progress)를 적재한다. 미리보기용이라 공개(비로그인 렌더 가능).
  async getCurriculum(courseIdRaw: string) {
    const courseId = this.toId(courseIdRaw);
    const course = await this.prisma.courses.findFirst({
      where: { id: courseId, status: 'published' },
      select: { id: true, title: true, thumbnail_url: true },
    });
    if (!course) throw new NotFoundException('course not found');

    const sections = await this.prisma.sections.findMany({
      where: { course_id: courseId },
      orderBy: { order_no: 'asc' },
      select: {
        id: true,
        title: true,
        order_no: true,
        lectures: {
          orderBy: { order_no: 'asc' },
          select: {
            id: true,
            title: true,
            duration: true,
            order_no: true,
            is_preview: true,
          },
        },
      },
    });

    return { course, sections };
  }

  private toId(raw: string): bigint {
    try {
      const id = BigInt(raw);
      if (id <= 0n) throw new Error('non-positive');
      return id;
    } catch {
      throw new BadRequestException('invalid course id');
    }
  }
}
