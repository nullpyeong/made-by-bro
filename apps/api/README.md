# apps/api — NestJS 백엔드

인증·코스·강의·결제·진도 API. NestJS + Prisma(PostgreSQL).

> 소스(텍스트)만 커밋되어 있고 `node_modules`는 각 PC에서 설치한다
> (OneDrive에 node_modules 동기화 방지 — `apps/web`과 동일 방식).

## 시작

```bash
# 1) 루트에서 DB 기동 (docker-compose.yml) + 스키마 적용 — SETUP.md 참고
docker compose up -d
docker exec -i made-by-bro-db psql -U madebybro -d madebybro < design-docs/schema.sql

# 2) 백엔드
cd apps/api
cp .env.example .env            # DATABASE_URL 확인
pnpm install
pnpm prisma:generate            # prisma/schema.prisma → @prisma/client 생성
pnpm start:dev                  # http://localhost:3000/api
```

확인:
```bash
curl http://localhost:3000/api/health    # {"status":"ok","db":"up"}
curl http://localhost:3000/api/courses
curl http://localhost:3000/api/offers     # 얼리버드 잔여석(seats_left) 포함
```

## 구조 (현재 스캐폴드)

```
src/
├─ main.ts            # 부트스트랩 (globalPrefix 'api', BigInt JSON 직렬화 패치)
├─ app.module.ts      # 루트 모듈
├─ prisma/            # PrismaModule(@Global) + PrismaService
├─ health/            # GET /api/health (DB 왕복 체크)
├─ courses/           # GET /api/courses (공개 코스)
└─ offers/            # GET /api/offers (얼리버드 잔여석) + claimSeat(오버부킹 차단)
```

## Prisma (ADR 0009)

- `design-docs/schema.sql`이 스키마 **SSOT**. Prisma 모델은 introspection으로 생성/갱신:
  ```bash
  pnpm prisma:pull        # DB → prisma/schema.prisma (model/enum 재생성)
  pnpm prisma:generate    # 클라이언트 재생성
  ```
- `prisma/schema.prisma`의 `generator`/`datasource` 블록만 손으로 유지, model/enum은 db pull 산출물.

## 예정 모듈

auth(회원가입/로그인/카카오/JWT/RBAC) · lectures(Signed URL·진도·퀴즈) ·
payments(토스 결제·수강권·환불·쿠폰) · referrals(추천코드·보상) · cohorts(시딩) — 설계문서/ADR 0006 기준.
