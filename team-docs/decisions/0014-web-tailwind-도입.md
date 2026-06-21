# 0014. 웹 CSS 전략 — Tailwind 도입 (토큰 브리지 + 점진 마이그레이션)

| | |
|---|---|
| 상태 | ✅ 채택 (방향) · 점진 전략은 유보 |
| 날짜 | 2026-06-21 |
| 파트 | Engineering / Design |
| 결정자 | 김지평 ("SETUP.md 원안으로 가자 확정") |

## 맥락
ADR [0010](0010-web-포팅-CSS전략.md)은 web 포팅 CSS 전략으로 **"app.css 재사용, Tailwind 전면 재작성 안 함"**을 제안(🟡 검토중)했고, 그 근거는 *마이그레이션의 본질은 CSS가 아니라 app.js 로직의 React화*라는 것이었다. 그 포팅이 일단락된 시점(12개 페이지 + 컴포넌트가 React로 옮겨짐)에서, 김지평이 **SETUP.md §2 원안(Tailwind)으로 정합화**하기로 확정했다. 즉 0010의 열린 질문을 반대 방향으로 결론낸다.

핵심 제약 두 가지:
- `tokens.css`(222줄, CSS 변수 SSOT) + `app.css`(1514줄)는 수십 차례 다듬은 검증된 디자인 시스템(라이트/다크, SaaS 오로라/그리드, sheen 효과 등)이다. **버리면 안 되고, 화면이 동일하게 유지돼야 한다.**
- `apps/web`는 OneDrive 동기화 + 멀티 PC 동시 작업 영역이다. **12개 페이지 JSX를 한 번에 갈아엎으면 진행 중 작업과 대규모 머지 충돌**이 난다.

## 결정
**Tailwind를 도입하되, 기존 디자인 토큰을 Tailwind config에 `var(--…)`로 브리지하고, 페이지는 점진적으로 유틸 전환한다.** (0010 대체)

1. **토큰 브리지** — `tailwind.config.js`가 색/라운드/그림자/타이포를 `tokens.css`의 CSS 변수로 매핑(`primary: var(--color-primary)` 등). 유틸(`bg-primary`, `text-muted`, `rounded-card`)이 변수로 해석되므로 `[data-theme="dark"]`만 변수를 덮으면 **다크모드·디자인이 그대로 보존**된다. 토큰 SSOT 포크 없음.
2. **하이브리드 패턴** — 레이아웃/간격/색은 유틸로. **효과가 박힌 리치 컴포넌트(`.btn-grad` sheen, reveal 등)는 app.css 컴포넌트 클래스를 유지**하거나 `@layer components`+`@apply`로 옮긴다. (순수 유틸로 옮기면 효과가 사라지는 회귀 발생)
3. **점진 전환** — `app.css`는 공존시키며 페이지 단위로 유틸 전환 → 전부 옮기면 retire. preflight는 공존 기간 동안 off(app.css가 리셋 보유), retire 후 on.

## 근거
- **0010의 우려(디자인 드리프트)를 브리지로 해소**: 토큰을 다시 쓰지 않고 변수에 연결하므로 1514줄을 "재작성"하는 게 아니라 "참조"한다. 다크모드도 공짜로 따라온다.
- **빅뱅 일괄 전환은 기각**: ① 멀티 PC 동시 작업과 12파일 머지 충돌, ② Playwright 미설치라 시각 회귀를 자동 검증 불가 — 한 방에 바꾸면 깨져도 못 잡는다. 점진 전환이 충돌·회귀 위험을 둘 다 낮춘다.
- SETUP.md §2 원안(Tailwind + 토큰 매핑)을 **그대로 실현**한다. 0010이 "무효화"했던 §2를 다시 유효화.

## 결과 / 영향
- **추가/변경(이번 단위)**: `apps/web`에 `tailwind.config.js`(토큰 브리지) · `postcss.config.js` · `src/styles/tailwind.css`(`@tailwind` 엔트리) · devDeps(`tailwindcss`·`postcss`·`autoprefixer`) · `main.tsx` import 순서(tokens → tailwind → app). 레퍼런스 전환: `Foot.tsx`(완전 유틸), `Stub.tsx`(레이아웃 유틸 + 컴포넌트 클래스 보존).
- **후속(점진)**: 나머지 11개 페이지를 작은 단위로 유틸 전환. **다른 PC가 해당 페이지를 동시 편집하지 않는 단위**로 끊어 충돌 회피. 전환 완료 페이지부터 app.css 의존 제거 → 최종적으로 app.css retire + preflight on.
- **검증 한계**: 시각 동일성은 자동 검증 불가(Playwright 없음) → 페이지 전환마다 로컬 프리뷰로 **사람 눈 확인** 필요.
- 0010 → `🔁 대체됨 → 0014`.

## 사람 확정 핸드오프 (필수)
> ADR은 AI가 임의로 `채택`하지 않는다. 아래는 사람 확정 기록이다.

- **확정자**: 김지평
- **확정일**: 2026-06-21
- **확정 범위**: web의 CSS 전략을 **Tailwind 도입(토큰 브리지)**으로 전환 — 0010(app.css 재사용)을 대체. SETUP.md §2 원안 정합.
- **유보**:
  - **전환 페이스** — 본 ADR은 *점진 전환*을 택했다(충돌·회귀 회피). "전면 일괄 전환"을 원하면 재지정 필요. **AI 권고: 점진.**
  - 효과 컴포넌트를 app.css 유지 vs `@layer components`로 이관하는 시점.
  - `tokens.css`를 `packages/shared`로 공유화하는 시점(현재 docs/web 중복 — 0010에서 이월된 과제).
  - app.css retire 및 preflight on 시점.
