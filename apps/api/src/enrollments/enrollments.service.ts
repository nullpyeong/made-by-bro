import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EnrollmentsService {
  constructor(private readonly prisma: PrismaService) {}

  // 로그인 유저의 수강목록 — 코스 정보 + 진도율(완료강의/전체강의)을 함께 반환.
  // 진도율은 progress.completed 행 수 / 해당 코스 전체 강의 수로 산정한다.
  // (수강건 수가 적어 강의/완료 카운트는 건별 조회로 충분)
  async listForUser(userId: bigint) {
    const enrollments = await this.prisma.enrollments.findMany({
      where: { user_id: userId },
      orderBy: { purchased_at: 'desc' },
      include: {
        courses: {
          select: { id: true, title: true, thumbnail_url: true, price: true },
        },
      },
    });

    return Promise.all(
      enrollments.map(async (e) => {
        const courseId = e.course_id;
        const total = await this.prisma.lectures.count({
          where: { sections: { course_id: courseId } },
        });
        const completed = await this.prisma.progress.count({
          where: {
            user_id: userId,
            completed: true,
            lectures: { sections: { course_id: courseId } },
          },
        });
        const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
        return {
          id: e.id,
          status: e.status,
          purchased_at: e.purchased_at,
          expires_at: e.expires_at,
          course: e.courses,
          progress: { total, completed, pct },
        };
      }),
    );
  }
}
