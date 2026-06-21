import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { EventsModule } from '../events/events.module';
import { ReferralsModule } from '../referrals/referrals.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { KakaoService } from './kakao.service';
import { JwtAuthGuard } from './jwt-auth.guard';

// 인증: 가입/로그인 + 세션(토큰) + 전역 가드(secure-by-default).
// 가입 시 추천 귀속·이벤트 로깅 → ReferralsModule·EventsModule 주입.
@Module({
  imports: [
    EventsModule,
    ReferralsModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => {
        const secret = cfg.get<string>('JWT_SECRET');
        if (!secret) {
          // eslint-disable-next-line no-console
          console.warn(
            '[auth] JWT_SECRET 미설정 — dev 임시 시크릿 사용. 운영 전 반드시 설정.',
          );
        }
        return {
          secret: secret ?? 'dev-insecure-secret-change-me',
          signOptions: { expiresIn: process.env.JWT_ACCESS_TTL ?? '15m' },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    KakaoService,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
})
export class AuthModule {}
