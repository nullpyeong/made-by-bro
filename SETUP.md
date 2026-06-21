# 개발 환경 셋업 가이드

> `apps/api`(Nest)와 `apps/web`(React)는 폴더·설정만 잡혀 있습니다.
> 실제 코드(node_modules 포함)는 아래 명령으로 **본인 PC에서** 생성하세요.
> (OneDrive 폴더에 node_modules가 동기화되는 걸 막기 위해 일부러 비워둠)

## 0. 사전 준비

- Node.js 20+ / pnpm (`npm i -g pnpm`)
- PostgreSQL — 로컬 Docker(아래 권장) 또는 Supabase/Neon 무료 인스턴스
- Docker Desktop (로컬 DB용)

### 로컬 DB (Docker Compose) — 권장

레포 루트에 `docker-compose.yml`이 있다. PostgreSQL 16 + 영구 볼륨.

```bash
# 레포 루트에서
docker compose up -d                  # DB 기동
# 스키마 적용 (최초 1회 — design-docs/schema.sql = 현재 SSOT)
docker exec -i made-by-bro-db psql -U madebybro -d madebybro < design-docs/schema.sql
docker compose down                   # 정지(데이터 유지) /  down -v 는 초기화
```

접속 문자열(`apps/api/.env`의 `DATABASE_URL`):

```
DATABASE_URL="postgresql://madebybro:madebybro@localhost:5432/madebybro?schema=public"
```

> Prisma 도입(ADR 0009)은 `apps/api` 스캐폴딩 후 `prisma db pull`로 위 스키마를 모델로 가져오는 방식. 자세히는 `team-docs/decisions/0009-orm-prisma.md`.

## 1. 백엔드 — NestJS (`apps/api`)

`apps/api`는 **이미 스캐폴딩되어 있다**(NestJS + Prisma, 소스만 커밋·node_modules 제외).
본인 PC에서 설치만 하면 된다:

```bash
cd apps/api
cp .env.example .env            # DATABASE_URL 확인 (위 Docker DB 기준)
pnpm install
pnpm prisma:generate            # prisma/schema.prisma → @prisma/client
pnpm start:dev                  # http://localhost:3000/api  (확인: GET /api/health)
```

> Prisma 모델은 `design-docs/schema.sql`(SSOT)을 introspection 한 산출물이다.
> 스키마 변경 시: schema.sql 수정 → DB 적용 → `pnpm prisma:pull` → `pnpm prisma:generate`.
> 인증/결제 등 추가 패키지(`@nestjs/jwt`, `passport`, `argon2`, `class-validator` 등)는
> 해당 모듈 구현 시 `pnpm add` 로 붙인다.

## 2. 프론트 — React + Vite + Tailwind (`apps/web`)

`apps/web`는 **이미 스캐폴딩 + Tailwind 구성**되어 있다(소스만 커밋, node_modules 제외). 설치만 하면 된다:

```bash
cd apps/web
pnpm install
pnpm dev                         # http://localhost:5173
```

> **Tailwind는 토큰 브리지 방식**(ADR 0014): `tailwind.config.js`가 색/라운드/그림자/타이포를
> `tokens.css`의 CSS 변수에 매핑한다 → 유틸(`bg-primary`, `text-muted`, `rounded-card`)이
> `var(--…)`로 해석되어 다크모드·디자인이 그대로 보존된다.
> 진입: `src/styles/tailwind.css`(`@tailwind` 디렉티브). import 순서는 `main.tsx` 참고
> (tokens → tailwind → app.css). 효과가 박힌 리치 컴포넌트(`.btn-grad` 등)는 app.css 클래스를
> 유지하고, 레이아웃/색/간격은 유틸로 — 페이지 단위로 점진 전환 중(app.css는 전환 완료 시 retire).

## 3. 디자인 토큰 재사용

`docs/design/tokens.css`가 디자인 SSOT입니다.
`apps/web`에서도 이 파일을 import 하거나 `packages/shared`로 옮겨 공유하세요.

## 4. 로컬 실행

```bash
# 백엔드
cd apps/api && pnpm start:dev      # http://localhost:3000

# 프론트
cd apps/web && pnpm dev            # http://localhost:5173
```

## 5. 배포 (나중에)

| 대상 | 추천 | 비고 |
|---|---|---|
| 랜딩(docs) | GitHub Pages | Settings → Pages → `main` / `/docs` |
| web(React) | Vercel | 무료 |
| api(Nest) | Railway / Render | 무료 티어 |
| DB | Supabase / Neon | 무료 티어 |

## 6. 누나에게 랜딩 보여주기 (지금 바로 가능)

1. 코드 push 후 GitHub 레포 → **Settings → Pages**
2. Source: **Deploy from a branch** → Branch **main** / 폴더 **/docs** → Save
3. 1~2분 뒤 뜨는 `https://<유저명>.github.io/made-by-bro/` 링크를 누나에게 전달
