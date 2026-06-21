import { Module } from '@nestjs/common';
import { EventsModule } from '../events/events.module';
import { ReferralsModule } from '../referrals/referrals.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

// 가입 시 추천 귀속 + 이벤트 로깅 → ReferralsModule·EventsModule 주입.
@Module({
  imports: [EventsModule, ReferralsModule],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
