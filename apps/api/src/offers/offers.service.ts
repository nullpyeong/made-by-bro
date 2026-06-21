import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OffersService {
  constructor(private readonly prisma: PrismaService) {}

  // 진행 중(open)인 얼리버드 오퍼 목록 + 잔여석.
  async listOpen() {
    const rows = await this.prisma.offers.findMany({
      where: { status: 'open' },
      orderBy: { id: 'asc' },
    });
    return rows.map((o) => ({
      ...o,
      seats_left: o.seat_limit - o.seat_taken,
    }));
  }

  /**
   * 얼리버드 1석 점유. 오버부킹은 조건부 UPDATE(seat_taken < seat_limit)로 차단.
   * 영향 행이 0이면 만석 → 예외. (결제 확정 트랜잭션에서 호출 예정)
   */
  async claimSeat(offerId: bigint): Promise<void> {
    const affected = await this.prisma.$executeRaw`
      UPDATE offers SET seat_taken = seat_taken + 1
      WHERE id = ${offerId} AND seat_taken < seat_limit`;
    if (affected === 0) {
      throw new BadRequestException('마감되었습니다 (만석)');
    }
  }
}
