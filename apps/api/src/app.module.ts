import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { HealthController } from './health/health.controller';
import { CoursesModule } from './courses/courses.module';
import { OffersModule } from './offers/offers.module';
import { ReferralsModule } from './referrals/referrals.module';
import { CohortsModule } from './cohorts/cohorts.module';
import { EventsModule } from './events/events.module';
import { RewardsModule } from './rewards/rewards.module';
import { AuthModule } from './auth/auth.module';
import { PaymentsModule } from './payments/payments.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    CoursesModule,
    OffersModule,
    ReferralsModule,
    CohortsModule,
    EventsModule,
    RewardsModule,
    AuthModule,
    PaymentsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
