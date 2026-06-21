import { Module } from '@nestjs/common';
import { RewardsModule } from '../rewards/rewards.module';
import { EventsModule } from '../events/events.module';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';

// 결제 웹훅 수신·확정(ADR 0003/0013).
// 확정 시 추천 전환(CAC)·이벤트 로깅 → RewardsModule·EventsModule 주입.
@Module({
  imports: [RewardsModule, EventsModule],
  controllers: [PaymentsController],
  providers: [PaymentsService],
})
export class PaymentsModule {}
