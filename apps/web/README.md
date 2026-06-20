# apps/web — React 프론트엔드

실제 수강생이 쓰는 앱. Vite + React + TypeScript + Tailwind.

> 아직 비어 있음. 루트 [`SETUP.md`](../../SETUP.md) 2번 절차로 Vite 앱을 생성하세요.

## 예정 화면 (랜딩 프로토타입 기반)

`docs/pages/`의 정적 시안을 실제 컴포넌트로 옮깁니다.

```
src/
├─ pages/       # home, course, player, login, cart, checkout, mypage, qna
├─ components/  # 공용 UI (디자인 토큰 기반)
├─ lib/         # api 클라이언트(axios), 인증
└─ styles/      # tokens.css 매핑
```

디자인 토큰: [`../../docs/design/tokens.css`](../../docs/design/tokens.css) 를 단일 소스로 사용.
