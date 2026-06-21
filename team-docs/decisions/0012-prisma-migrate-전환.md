# 0012. SQL-first → Prisma migrate 전환 (스키마 SSOT 이전)

| | |
|---|---|
| 상태 | ✅ 채택 |
| 날짜 | 2026-06-21 |
| 파트 | Engineering |
| 결정자 | 제안: AI / 확정: 김지평 |

## 맥락
현재 백엔드 스키마 관리는 **SQL-first + introspection** 방식이다:

```
design-docs/schema.sql  (손으로 쓰는 DDL = 현재 SSOT)
      ↓ docker postgres 에 적용
   PostgreSQL
      ↓ prisma db pull (역방향 introspect)
   schema.prisma  (31개 모델, 자동 생성)
```

근거(실측):
- `apps/api/prisma/migrations/` 폴더 **없음** (마이그레이션 이력 0개)
- `apps/api/package.json` 스크립트 = `prisma:pull`(db pull) + `prisma:generate`만. **`prisma migrate` 없음**
- `schema.prisma` 는 `db pull` 산출물 (introspection 결과)

이 방식은 0009(ORM=Prisma) 채택 당시 *임시 경로*로 명시됐다. 0009의 「결과/영향」이 이미 **baseline 마이그레이션 → SSOT를 schema.prisma 로 이전**하는 후속을 예고했고, 「유보」에 *"이관 실행은 apps/api 스캐폴딩 시점 후속"* 으로 남겨뒀다. 지금이 그 시점이다:

- `apps/api` 가 실제로 스캐폴딩됨 (auth/JWT·events·rewards 랜딩, 0011)
- **스키마가 활발히 바뀌는 중** — 최근 커밋들에서 `schema.sql` 이 반복 수정됨
- 작업자 2명 협업 — 마이그레이션 이력이 없으면 "누가 언제 어떤 컬럼을 바꿨나"가 추적 안 되고, 한쪽 DB와 다른 쪽 DB가 조용히 갈라질 수 있다 (재현 불가능한 환경)

## 결정 (제안)
**스키마 SSOT 를 `design-docs/schema.sql` → Prisma migrate(`prisma/migrations/`)로 이전한다.** 기존 스키마를 baseline 마이그레이션으로 고정한 뒤, 이후 모든 스키마 변경은 `prisma migrate dev`(개발) / `prisma migrate deploy`(운영)로만 한다.

## 근거
- **협업 안전성(핵심)** — 마이그레이션 파일이 git에 버전관리되면, 스키마 변경이 코드 리뷰·이력 추적 대상이 된다. 2인 체제에서 "schema.sql 손수정 → 각자 db pull" 은 동기화 사고의 단골 원인.
- **재현 가능한 DB** — 새 PC/CI에서 `migrate deploy` 한 방으로 동일 스키마 재구성. 지금은 schema.sql 을 수동 적용해야 함.
- **롤백·드리프트 감지** — `migrate` 는 적용된 마이그레이션과 실제 DB의 드리프트를 감지하고 경고한다.
- **0009와 정합** — 0009가 이미 이 경로를 "정식 도입"으로 예고했으므로, 이건 새 방향이 아니라 **예고된 실행의 승인**이다.
- **버린 대안**:
  - *SQL-first 유지* — 가장 적은 변경이지만, 위 협업/재현/드리프트 문제를 그대로 안고 감. 100명 규모·2인 협업으로 가면 비용이 커짐. 기각.
  - *Drizzle 등 다른 마이그레이션 도구* — 0009에서 이미 ORM을 Prisma로 확정했으므로 도구 일관성상 부적합. 기각.
- **알려진 트레이드오프(수용)**: 초기 baseline 작업 1회 필요 + 팀원 모두 "이제 schema.sql 손수정 금지, migrate 로만" 규율을 지켜야 함.

## 결과 / 영향
- **SSOT 이전**: `design-docs/schema.sql` → `apps/api/prisma/schema.prisma` + `apps/api/prisma/migrations/`. (schema.sql 은 baseline 참고용 아카이브로 남기거나 제거)
- **이전 절차(표준 baseline 워크플로우)**:
  1. 현재 schema.prisma 가 실 DB와 일치하는지 `prisma db pull` 로 재확인
  2. `prisma migrate diff --from-empty --to-schema-datamodel` 로 초기 마이그레이션 SQL 생성 → `prisma/migrations/0_init/migration.sql` 로 저장
  3. `prisma migrate resolve --applied 0_init` 로 기존 DB를 baseline 으로 표시(이미 적용됨 처리)
  4. 이후 변경은 `prisma migrate dev --name <변경명>` 으로만
- **package.json 스크립트 추가**: `prisma:migrate`(dev), `prisma:deploy`(prod), `prisma:studio`
- **[전 작업자] 규율 변경**: schema.sql 직접 수정 중단. 스키마 변경은 schema.prisma 수정 → `migrate dev` 로.
- **OneDrive 제약(0009 동일)**: baseline·migrate 실행은 OneDrive 밖 실 작업 PC에서. OneDrive 에는 `migrations/` 텍스트 산출물만 커밋.
- **리스크**: baseline 시점에 두 작업자의 로컬 DB가 이미 갈라져 있으면 baseline 전에 한 번 정렬 필요. → 전환은 **누나와 일정 합의 후** 한 명이 baseline 을 만들고 다른 한 명이 그 위에서 시작하는 게 안전.

## 사람 확정 핸드오프 (필수)
> ADR은 AI가 임의로 `채택`하지 않는다. `채택`으로 올리기 전에 **반드시 사람이 결정권을 행사**해야 하며, 그 기록을 아래에 남긴다.
> 사람 확정 전에는 상태를 `검토중`으로 둔다.

- **확정자**: 김지평
- **확정일**: 2026-06-21
- **확정 범위**: Prisma migrate 전환 승인. baseline 마이그레이션(`0_init`) 생성 + package 스크립트 도입까지 진행. schema.sql 은 **아카이브로 보존**(제거하지 않음).

### 실제로 한 것 (AI 실행, 2026-06-21)
- `apps/api/prisma/schema.prisma` 에 익스텐션 선언 추가: `previewFeatures = ["postgresqlExtensions"]` + `datasource.extensions = [pgcrypto, pg_trgm, citext]`.
  - **이유**: 첫 baseline 생성 시 `migrate diff` 가 `CREATE EXTENSION` 을 누락해(스키마에 미선언) 빈 DB 적용이 `citext` 타입 부재로 실패했다. 익스텐션을 SSOT(schema.prisma)에 명시해 실제 DB와 일치시킴. (introspection 기반 baseline 의 전형적 누락 — 검증으로 잡음)
- `apps/api/prisma/migrations/0_init/migration.sql` 생성 — `migrate diff --from-empty --to-schema-datamodel` 산출(DB 불필요). 31 테이블 · 17 enum · 50 FK · 익스텐션 3.
- `apps/api/prisma/migrations/migration_lock.toml` 추가 (provider=postgresql).
- `apps/api/package.json` 스크립트 추가: `prisma:migrate`(dev) · `prisma:deploy`(prod) · `prisma:studio` · `prisma:baseline`(= `migrate resolve --applied 0_init`).
- **검증**: 일회용 docker postgres(빈 DB)에 `0_init/migration.sql` 적용 → **exit 0, 31 테이블·17 enum·50 FK·익스텐션 3개 전부 생성** 확인.

### 각 작업자가 1회씩 직접 해야 할 단계 (DB 필요 — 여기선 미실행)
> AI 작업 환경엔 실 DB(docker postgres)가 떠 있지 않고 `.env`/prisma 설치도 없어서, **DB를 건드리는 단계는 실행하지 못함**. 각자 로컬에서 1회:
1. 기존 로컬 DB가 schema.prisma 와 일치하는지 확인 (`pnpm --filter api prisma:pull` 으로 드리프트 점검)
2. 기존 DB를 baseline 으로 표시: `pnpm --filter api prisma:baseline` (= `migrate resolve --applied 0_init`) — 기존 DB에 `0_init` 을 "이미 적용됨" 처리(테이블 재생성 안 함)
3. 새 PC/CI 처럼 **빈 DB** 라면 위 대신 `pnpm --filter api prisma:deploy` 한 번으로 baseline 부터 재구성
4. 이후 스키마 변경은 `schema.prisma` 수정 → `pnpm --filter api prisma:migrate -- --name <변경명>` 으로만

### 후속/유보
- **누나 조율 필수**: baseline 시점에 누나 로컬 DB가 schema.prisma 와 갈라져 있으면 위 2단계 전에 한 번 정렬 필요. 갈라짐 있으면 `migrate resolve` 대신 DB 재생성 후 `migrate deploy` 권장.
- `previewFeatures` 추가로 `@prisma/client` 재생성 필요(`prisma:generate`) — 설치된 PC에서 1회.
- schema.sql 은 `design-docs/` 에 **아카이브로 보존**(SSOT 는 이제 `prisma/migrations/`). 상단에 전환 안내 배너 추가함.
