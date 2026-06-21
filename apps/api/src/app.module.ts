import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { HealthController } from './health/health.controller';
import { CoursesModule } from './courses/courses.module';
import { OffersModule } from './offers/offers.module';
import { ReferralsModule } from './referrals/referrals.module';
import { CohortsModule } from './cohorts/cohorts.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    CoursesModule,
    OffersModule,
    ReferralsModule,
    CohortsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
