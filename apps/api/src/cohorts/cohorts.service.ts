import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

// ADR 0006 시딩 코호트(레벨·기수별 순차 개방). 60명을 한 번에 풀지 않고 코호트로 쪼개 운영.
@Injectable()
export class CohortsService {
  constructor(private readonly prisma: PrismaService) {}

  private static isUniqueViolation(e: unknown): boolean {
    return (
      e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002'
    );
  }

  // 코호트 목록 + 멤버 수.
  async list() {
    const rows = await this.prisma.cohorts.findMany({
      orderBy: { id: 'asc' },
      include: { _count: { select: { cohort_members: true } } },
    });
    return rows.map(({ _count, ...c }) => ({
      ...c,
      member_count: _count.cohort_members,
    }));
  }

  // 코호트 생성.
  create(input: { name?: unknown; notes?: unknown; startedAt?: unknown }) {
    const name = typeof input?.name === 'string' ? input.name.trim() : '';
    if (!name) throw new BadRequestException('name이 필요합니다');
    let started_at: Date | undefined;
    if (input.startedAt != null && input.startedAt !== '') {
      const d = new Date(input.startedAt as string);
      if (Number.isNaN(d.getTime())) {
        throw new BadRequestException('startedAt 형식이 올바르지 않습니다');
      }
      started_at = d;
    }
    return this.prisma.cohorts.create({
      data: {
        name,
        notes: typeof input.notes === 'string' ? input.notes : undefined,
        started_at,
      },
    });
  }

  // 멤버 추가(코호트·유저 존재 확인, 중복 가입 차단).
  async addMember(cohortId: bigint, userId: bigint) {
    const cohort = await this.prisma.cohorts.findUnique({
      where: { id: cohortId },
    });
    if (!cohort) throw new NotFoundException('존재하지 않는 코호트입니다');
    const user = await this.prisma.users.findUnique({ where: { id: userId } });
    if (!user) throw new BadRequestException('존재하지 않는 사용자입니다');
    try {
      return await this.prisma.cohort_members.create({
        data: { cohort_id: cohortId, user_id: userId },
      });
    } catch (e) {
      if (CohortsService.isUniqueViolation(e)) {
        throw new ConflictException('이미 코호트에 속한 사용자입니다');
      }
      throw e;
    }
  }

  // 멤버 목록(민감정보 제외).
  async members(cohortId: bigint) {
    const cohort = await this.prisma.cohorts.findUnique({
      where: { id: cohortId },
    });
    if (!cohort) throw new NotFoundException('존재하지 않는 코호트입니다');
    return this.prisma.cohort_members.findMany({
      where: { cohort_id: cohortId },
      orderBy: { id: 'asc' },
      select: {
        id: true,
        joined_at: true,
        users: { select: { id: true, name: true, email: true, role: true } },
      },
    });
  }
}
