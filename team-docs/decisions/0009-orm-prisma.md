# 0009. ORM = Prisma

| | |
|---|---|
| 상태 | ✅ 채택 |
| 날짜 | 2026-06-21 |
| 파트 | Engineering |
| 결정자 | 김지평 |

## 맥락
ORM은 여러 문서(`README.md`, `SETUP.md`, `team-docs/02-engineering.md`, `apps/api/README.md`)에 **Prisma**로 적혀 있었지만, **결정 기록(ADR)이 없었다.** `설계문서.md`에는 "Prisma/Drizzle"로 흔들리는 흔적도 남아 있어, 0001(NestJS)과 같은 정합성 구멍이 있었다.

`apps/api`(NestJS) 스캐폴딩과 DB 마이그레이션을 본격적으로 굴리기 직전이라, "왜 Prisma인가"를 지금 박아 흔들림을 막아야 한다.

## 결정
**백엔드 ORM은 Prisma를 쓴다.** (`apps/api` = NestJS + Prisma)

## 근거
- **타입 안전 + DX** — schema 기반 타입 자동생성으로 DTO/쿼리 타입 안전성이 최상. 1인/소수 체제에서 실수 방지 효과가 큼.
- **마이그레이션 도구 내장** — `prisma migrate`로 스키마 변경 이력 관리. 별도 마이그레이션 도구 불필요.
- **생태계 성숙** — NestJS 연동 레퍼런스가 풍부, 학습 곡선이 낮음.
- **버린 대안**:
  - *TypeORM* — NestJS 1급 연동이지만 마이그레이션/타입 안전성이 Prisma보다 거칠다. 기각.
  - *Drizzle* — SQL에 가깝고 가볍지만, 자동 마이그레이션·생태계 성숙도가 아직 Prisma보다 낮다. 100명 규모에선 Prisma의 안정성이 우선. 기각.
- **알려진 트레이드오프(수용)**: 복잡한 쿼리·raw 성능은 약간 손해. "단건 OR 구독" 접근 판정(0008) 같은 복합 쿼리는 필요 시 `$queryRaw`로 보완.

## 결과 / 영향
- **DB 스키마의 단일 진실(SSOT)은 당분간 `design-docs/schema.sql`** (손으로 관리하는 DDL). 현재 이 파일이 docker 개발 DB에 그대로 적용돼 있다.
- **Prisma 정식 도입 경로(후속, apps/api 스캐폴딩 시)** — 기존 DB에 Prisma를 얹는 표준 워크플로우:
  1. `schema.sql`을 DB에 적용(이미 됨)
  2. `prisma db pull`(introspect)로 `schema.prisma` 생성 → 손DDL과 Prisma 모델 일치
  3. baseline 마이그레이션 생성 후 `prisma migrate resolve --applied`로 기준점 고정
  4. 이후 스키마 변경은 `prisma migrate`가 관리 (SSOT가 `schema.prisma`로 이전)
- **OneDrive 제약**: `apps/api`는 의도적으로 비어 있음(SETUP.md — node_modules 동기화 방지). 따라서 Prisma 설치·`db pull`·`migrate`는 **OneDrive 밖 실 작업 PC**에서 수행한다. OneDrive 폴더에는 `schema.prisma`·`migrations/` 등 텍스트 산출물만 커밋.
- **[Data]** 0006 측정용 이벤트 테이블이 추가되면 Prisma 모델로 같이 관리.

## 사람 확정 핸드오프 (필수)
> ADR은 AI가 임의로 `채택`하지 않는다. `채택`으로 올리기 전에 **반드시 사람이 결정권을 행사**해야 하며, 그 기록을 아래에 남긴다.

- **확정자**: 김지평
- **확정일**: 2026-06-21
- **확정 범위**: 백엔드 ORM을 **Prisma로 확정**. (사용자 지시: "0009로 Prisma 박아둘까?" → "응")
- **유보**:
  - schema.sql → Prisma 모델 이관(`db pull` baseline)의 *실행*은 apps/api 스캐폴딩 시점 후속.
  - 복합 쿼리에서 `$queryRaw` 사용 범위는 구현하며 판단.
