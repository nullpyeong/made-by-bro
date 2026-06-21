import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

// Prisma BigINT(IDENTITY PK) → JSON 직렬화 시 Express가 던지지 않도록 문자열화.
(BigInt.prototype as unknown as { toJSON: () => string }).toJSON = function () {
  return this.toString();
};

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`api listening on http://localhost:${port}/api`);
}
bootstrap();
