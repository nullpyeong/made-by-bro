# 02. Engineering

> 프론트·백엔드·인프라를 안 깨지게. "그릇은 안 깨지고 결제 잘 되면 80점."

| | |
|---|---|
| 담당 | 김지평 (풀스택) |
| 상태 | 설계 → 초기 개발 |

## 책임 범위
- `apps/web` (프론트), `apps/api` (백엔드), `packages/shared` (공유 타입)
- 인프라·배포·CI
- 영상 보호·인증·결제 연동
- 데이터 모델 (`design-docs/schema.sql`, `erd.mermaid`)

## 기술 스택 (확정분)
| 영역 | 선택 |
|---|---|
| DB | PostgreSQL (Supabase/Neon) + Prisma |
| 인증 | JWT(Access/Refresh) + 카카오 OAuth |
| 영상 | Cloudflare Stream (Signed URL + 워터마크) |
| 결제 | 토스페이먼츠 |
| 배포 | Vercel (+ 필요 시 Railway) |

## 지금 결정된 것 (Decided)
- 영상 보호 **수준 3**: Signed URL + 사용자별 동적 워터마크 ([0002](decisions/0002-영상-보호-수준3.md))
- 결제: 토스페이먼츠 ([0003](decisions/0003-결제-토스페이먼츠.md))

## 열린 질문 (Open) ⚠️
- **백엔드 프레임워크 불일치**: `README.md`는 **NestJS**, `design-docs/설계문서.md`는 **Next.js Route Handlers**라고 적혀 있음.
  → 하나로 확정해야 함. [0001 — 백엔드 프레임워크](decisions/0001-백엔드-프레임워크.md) 에서 `검토중`으로 추적 중.
- 모노레포(pnpm) 유지 vs Next.js 단일 앱으로 단순화

## 백로그
- [ ] 0001 결정 확정 후 README/설계문서 일치시키기
- [ ] 결제 웹훅 처리·정산 데이터 모델
- [ ] 완청 인증 로직 (구간 시청률 집계)

## 관련 결정
- [0001 — 백엔드 프레임워크 (검토중)](decisions/0001-백엔드-프레임워크.md)
- [0002 — 영상 보호 수준 3](decisions/0002-영상-보호-수준3.md)
- [0003 — 결제 토스페이먼츠](decisions/0003-결제-토스페이먼츠.md)
