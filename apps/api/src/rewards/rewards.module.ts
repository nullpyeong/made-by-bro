import { Module } from '@nestjs/common';
import { EventsModule } from '../events/events.module';
import { RewardsController } from './rewards.controller';
import { RewardsService } from './rewards.service';

// 보상 지급은 활성화 이벤트 로깅과 한 트랜잭션 → EventsModule 주입.
@Module({
  imports: [EventsModule],
  controllers: [RewardsController],
  providers: [RewardsService],
  exports: [RewardsService],
})
export class RewardsModule {}
