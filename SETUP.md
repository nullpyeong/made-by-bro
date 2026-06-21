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

```bash
# 레포 루트에서
cd apps
npx @nestjs/cli new api --skip-git --package-manager pnpm
#  → 이미 api 폴더가 있으니, 물어보면 덮어쓰기 허용 또는 임시폴더 생성 후 내용 이동

# 자주 쓰는 패키지
cd api
pnpm add @nestjs/config @nestjs/jwt @nestjs/passport passport passport-jwt
pnpm add prisma @prisma/client
pnpm add argon2 class-validator class-transformer
pnpm dlx prisma init        # prisma/schema.prisma 생성 → design-docs/schema.sql 참고해 모델 작성
```

## 2. 프론트 — React + Vite (`apps/web`)

```bash
cd apps
pnpm create vite web --template react-ts
cd web
pnpm add -D tailwindcss postcss autoprefixer
pnpm dlx tailwindcss init -p
pnpm add axios react-router-dom @tanstack/react-query
```

> Tailwind 설정에는 `design-docs`/`docs/design/tokens.css`의 토큰을 매핑해 쓰세요.
> (디자인 토큰 매핑 예시는 기존 `DESIGN.md` 6절 참고)

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
