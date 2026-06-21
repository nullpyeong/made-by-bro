import { Injectable } from '@nestjs/common';
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
}
