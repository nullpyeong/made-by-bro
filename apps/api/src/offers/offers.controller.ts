import { Controller, Get } from '@nestjs/common';
import { OffersService } from './offers.service';

@Controller('offers')
export class OffersController {
  constructor(private readonly offers: OffersService) {}

  // 진행 중 얼리버드 오퍼(잔여석 포함). course.html '37/100' 하드코딩의 실데이터 소스.
  @Get()
  listOpen() {
    return this.offers.listOpen();
  }
}
