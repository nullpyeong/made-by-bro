import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

// 플레이어가 보내는 진도 저장 입력. lectureId는 실제 DB lectures.id(숫자 문자열).
export interface SaveProgressInput {
  lectureId: string | number;
  // 마지막 재생 위치(초). 이어보기 복원용.
  positionSeconds?: number;
  // 누적 시청 초. 단조 증가로만 반영(되감기로 줄지 않음).
  watchedSeconds?: number;
  // 완청 신호. true면 completed + 최초 완청 시각 고정.
  completed?: boolean;
}

@Injectable()
export class ProgressService {
  constructor(private readonly prisma: PrismaService) {}

  // 강의 1개의 진도 upsert — (user_id, lecture_id) 유니크 기준.
  // 수강목록 진도율(enrollments)이 progress.completed를 세므로, 이 경로가 그 토대다.
  // watched_seconds는 max로만 올리고(되감기 무효), completed는 한 번 true면 유지(언컴플릿 방지),
  // completed_at은 최초 완청 시각을 보존한다.
  async save(userId: bigint, input: SaveProgressInput) {
    const lectureId = this.toLectureId(input.lectureId);

    const lecture = await this.prisma.lectures.findUnique({
      where: { id: lectureId },
      select: { id: true },
    });
    if (!lecture) throw new NotFoundException('lecture not found');

    const existing = await this.prisma.progress.findUnique({
      where: { user_id_lecture_id: { user_id: userId, lecture_id: lectureId } },
    });

    const incomingWatched = this.nonNegInt(input.watchedSeconds) ?? 0;
    const watched_seconds = Math.max(existing?.watched_seconds ?? 0, incomingWatched);
    const last_position =
      this.nonNegInt(input.positionSeconds) ?? existing?.last_position ?? 0;
    const max_position = Math.max(existing?.max_position ?? 0, last_position);
    const completed = input.completed === true || existing?.completed === true;
    const completed_at = completed
      ? (existing?.completed_at ?? new Date())
      : null;

    const row = await this.prisma.progress.upsert({
      where: { user_id_lecture_id: { user_id: userId, lecture_id: lectureId } },
      create: {
        user_id: userId,
        lecture_id: lectureId,
        watched_seconds,
        last_position,
        max_position,
        completed,
        completed_at,
      },
      update: {
        watched_seconds,
        last_position,
        max_position,
        completed,
        completed_at,
        updated_at: new Date(),
      },
      select: {
        lecture_id: true,
        watched_seconds: true,
        last_position: true,
        completed: true,
        completed_at: true,
      },
    });
    return row;
  }

  // 코스 1개의 내 진도 목록 — 재생목록 체크표시·이어보기 지점 계산용.
  // 해당 코스 강의들에 대한 progress 행만 반환(없는 강의는 미수강으로 간주).
  async listForCourse(userId: bigint, courseIdRaw: string) {
    const courseId = this.toCourseId(courseIdRaw);
    return this.prisma.progress.findMany({
      where: {
        user_id: userId,
        lectures: { sections: { course_id: courseId } },
      },
      select: {
        lecture_id: true,
        completed: true,
        last_position: true,
        watched_seconds: true,
      },
    });
  }

  // 이어보기 복원 — 해당 강의 진도(없으면 0 기본).
  async getOne(userId: bigint, lectureIdRaw: string) {
    const lectureId = this.toLectureId(lectureIdRaw);
    const row = await this.prisma.progress.findUnique({
      where: { user_id_lecture_id: { user_id: userId, lecture_id: lectureId } },
      select: {
        lecture_id: true,
        watched_seconds: true,
        last_position: true,
        completed: true,
        completed_at: true,
      },
    });
    return (
      row ?? {
        lecture_id: lectureId,
        watched_seconds: 0,
        last_position: 0,
        completed: false,
        completed_at: null,
      }
    );
  }

  private toLectureId(raw: string | number): bigint {
    try {
      const id = BigInt(raw);
      if (id <= 0n) throw new Error('non-positive');
      return id;
    } catch {
      throw new BadRequestException('invalid lectureId');
    }
  }

  private toCourseId(raw: string): bigint {
    try {
      const id = BigInt(raw);
      if (id <= 0n) throw new Error('non-positive');
      return id;
    } catch {
      throw new BadRequestException('invalid courseId');
    }
  }

  private nonNegInt(v: unknown): number | undefined {
    if (typeof v !== 'number' || !Number.isFinite(v) || v < 0) return undefined;
    return Math.floor(v);
  }
}
