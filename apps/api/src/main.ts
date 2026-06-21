import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

// Prisma BigINT(IDENTITY PK) → JSON 직렬화 시 Express가 던지지 않도록 문자열화.
(BigInt.prototype as unknown as { toJSON: () => string }).toJSON = function () {
  return this.toString();
};

async function bootstrap() {
  // rawBody: true → req.rawBody(Buffer) 보존. 결제 웹훅 HMAC 서명 검증에 필요(ADR 0013).
  const app = await NestFactory.create(AppModule, { rawBody: true });
  // 프론트(정적 랜딩 file://·GitHub Pages, Vite dev)에서 /api 호출 허용.
  // 운영에선 CORS_ORIGIN(쉼표구분)으로 화이트리스트. 미설정 시 dev 편의로 전체 허용.
  const origins = (process.env.CORS_ORIGIN ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  app.enableCors({ origin: origins.length ? origins : true });
  app.setGlobalPrefix('api');
  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`api listening on http://localhost:${port}/api`);
}
bootstrap();
