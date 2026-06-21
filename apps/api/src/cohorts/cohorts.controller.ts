import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CohortsService } from './cohorts.service';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

function toId(v: unknown, field: string): bigint {
  try {
    return BigInt(v as string);
  } catch {
    throw new BadRequestException(`${field}가 올바르지 않습니다`);
  }
}

// 코호트는 운영(관리자) 기능. 컨트롤러 전체 admin 전용(ADR 0011).
// 전역 JwtAuthGuard(로그인) + RolesGuard('admin').
@Roles('admin')
@UseGuards(RolesGuard)
@Controller('cohorts')
export class CohortsController {
  constructor(private readonly cohorts: CohortsService) {}

  // 코호트 목록 + 멤버 수.
  @Get()
  list() {
    return this.cohorts.list();
  }

  // 코호트 생성.
  @Post()
  create(@Body() body: { name?: unknown; notes?: unknown; startedAt?: unknown }) {
    return this.cohorts.create(body ?? {});
  }

  // 멤버 추가.
  @Post(':id/members')
  addMember(@Param('id') id: string, @Body('userId') userId: unknown) {
    return this.cohorts.addMember(toId(id, 'id'), toId(userId, 'userId'));
  }

  // 멤버 목록.
  @Get(':id/members')
  members(@Param('id') id: string) {
    return this.cohorts.members(toId(id, 'id'));
  }
}
