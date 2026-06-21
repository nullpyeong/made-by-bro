# apps/web — React 프론트엔드

실제 수강생이 쓰는 앱. **Vite + React + TypeScript.**
디자인은 [`src/styles/`](src/styles)의 `tokens.css` + `app.css`(= `docs/`의 디자인 시스템)를 그대로 재사용한다. → [ADR 0008](../../team-docs/decisions/0008-web-포팅-CSS전략.md)

## 실행

```bash
pnpm install      # (레포 루트 또는 이 폴더에서)
pnpm dev          # http://localhost:5173
pnpm build        # dist/ 프로덕션 빌드
pnpm preview      # 빌드 결과 미리보기(4173)
```

## 구조

```
src/
├─ main.tsx              # 엔트리 (BrowserRouter + 전역 스타일 import)
├─ App.tsx               # 라우팅 (10개 화면)
├─ components/
│  └─ AppShell.tsx       # 전역 셸: 테마/클릭위임(1회) + 페이지효과(라우트마다 재무장)
├─ lib/
│  └─ interactions.ts    # docs/pages/app.js 횡단 동작 포팅(toast·theme·reveal·count·spotlight·cart·클릭위임)
├─ pages/
│  ├─ Home.tsx           # ✅ 포팅 완료(랜딩)
│  └─ Stub.tsx           # 🚧 미포팅 화면 자리표시
└─ styles/
   ├─ tokens.css         # 디자인 토큰(SSOT 복사본 — 추후 packages/shared로 공유 예정)
   └─ app.css            # 공용 컴포넌트 스타일(docs와 동일)
```

## 포팅 현황

| 화면 | 상태 | 비고 |
|---|---|---|
| home | ✅ 완료 | 헤드리스 렌더로 docs와 동일성 확인 |
| course · player · mypage · cart · checkout · complete · login · qna · admin | 🚧 Stub | 라우트는 살아 있음. `app.js`의 해당 로직(장바구니·진도모델·강의실 엔진·대시보드)을 React 상태로 정식 재구성 예정 |

## 포팅 방식

- **정적 화면**(home): HTML→JSX(동일 className/data-attr) + `app.js` 동작을 `AppShell` effect로 연결.
- **동적 화면**(player·cart·checkout·mypage): `app.js`의 `localStorage` 로직을 React 상태/컨텍스트로 재구성.
- 페이지 간 이동은 React Router `<Link>`, 같은 페이지 앵커는 `<a href="#...">`.
- `docs/`(정적 시안, GitHub Pages)는 그대로 유지 — 누나 리뷰 링크가 계속 살아 있음.
