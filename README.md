# made-by-bro 🎓

> 동생이 누나 학원을 위해 만든 온라인 영어 인강 사이트 — **에픽영어교습소**

초·중등 영어 인강 플랫폼. 완청(끝까지 보기) 인증, 구간 퀴즈, 1:1 선생님 Q&A로 끝까지 완주하도록 설계했습니다.

---

## 📁 프로젝트 구조

```
made-by-bro/
├─ docs/              # 누나용 정적 랜딩/프로토타입 (GitHub Pages가 여기를 띄움)
│  ├─ index.html      #   진입점 → pages/home.html 로 자동 이동
│  ├─ pages/          #   home, course, player, login, cart, qna ...
│  └─ design/         #   디자인 토큰(tokens.css)
├─ apps/
│  ├─ api/            # 실제 백엔드 — NestJS (개발 예정)
│  └─ web/            # 실제 프론트 — React + Vite (개발 예정)
├─ packages/
│  └─ shared/         # 프론트·백 공유 타입(DTO 등)
├─ design-docs/       # 설계문서·DB 스키마·ERD (서비스에 노출 X)
└─ SETUP.md           # 개발 환경 셋업 가이드
```

## 🌐 두 갈래로 동작

| 구분 | 무엇 | 누가 봄 | 어떻게 |
|---|---|---|---|
| **랜딩** | `docs/` 정적 페이지 | 누나·방문자 | GitHub Pages 링크 |
| **실제 앱** | `apps/api` + `apps/web` | (배포 후) 수강생 | Vercel + Railway 등 배포 |

> GitHub Pages는 정적 파일만 띄웁니다. 실제 앱(서버+DB)은 별도 배포해야 동작합니다.

## 🛠 기술 스택

| 영역 | 선택 |
|---|---|
| 프론트 | React + Vite + TypeScript + Tailwind |
| 백엔드 | NestJS + TypeScript |
| DB | PostgreSQL + Prisma |
| 인증 | JWT (Access/Refresh) + 카카오 OAuth |
| 영상 | Cloudflare Stream (Signed URL + 워터마크) |
| 결제 | 토스페이먼츠 |

자세한 설계는 [`design-docs/설계문서.md`](design-docs/설계문서.md) 참고.

## 🚀 시작하기

[`SETUP.md`](SETUP.md) 참고.

---

made with **brotherly-load** ❤️ — for noona
