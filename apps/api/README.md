# apps/api — NestJS 백엔드

실제 돌아가는 서버. 인증·코스·강의·결제·진도 API 담당.

> 아직 비어 있음. 루트 [`SETUP.md`](../../SETUP.md) 1번 절차로 NestJS를 생성하세요.

## 예정 모듈 (설계문서 기준)

```
src/
├─ auth/        # 회원가입/로그인/카카오/JWT/RBAC
├─ courses/     # 코스 목록·상세·검색
├─ lectures/    # 영상 Signed URL·진도·북마크·퀴즈
├─ payments/    # 토스 결제·수강권·환불·쿠폰
├─ users/       # 프로필
├─ common/      # 가드·인터셉터·필터
└─ prisma/      # Prisma 서비스
```

DB 스키마는 [`../../design-docs/schema.sql`](../../design-docs/schema.sql) → Prisma 모델로 옮겨 사용.
