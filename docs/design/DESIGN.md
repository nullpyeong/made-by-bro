# EPIC 디자인 시스템 — Friendly Bright

프로젝트 전역 톤앤매너 기준 문서. **모든 색·라운드·그림자는 `tokens.css`의 토큰을 단일 소스로 사용**한다. 이 문서는 규칙과 근거를 정의하고, 토큰은 그 규칙을 코드로 강제한다.

## 0. 적용 구조 (3계층)

```
tokens.css (CSS 변수, SSOT)  →  tailwind.config 매핑  →  컴포넌트
        └─ 다크모드/테마는 토큰만 덮어쓰면 전체 반영
DESIGN.md = 사람용 합의 문서 (규칙·상태·Do/Don't)
```

적용 순서:
1. `app/globals.css` 최상단에 `@import "../design/tokens.css";`
2. `tailwind.config.ts`에 토큰 매핑(아래 6절) → `bg-primary` 같은 유틸 사용
3. 컴포넌트는 토큰/유틸만 사용, **hex 하드코딩 금지**

## 1. 브랜드 톤

밝고 친근하며 부담 없는 분위기. 파란색(신뢰·집중) + 앰버(따뜻함·호기심)의 조합. 둥근 모서리와 부드러운 파란 그림자로 "누구나 시작할 수 있는 영어"를 표현한다. 슬로건 *Every Person Is Curious* 와 호응.

## 2. 컬러

| 역할 | 토큰 | 값 |
|---|---|---|
| Primary | `--color-primary` | #2563EB |
| Primary hover / active | `--color-primary-hover` / `--color-primary-active` | #1D54D6 / #1A45B0 |
| Primary soft(연배경) | `--color-primary-soft` | #EEF4FF |
| Accent / soft | `--color-accent` / `--color-accent-soft` | #F59E0B / #FFF8EC |
| 본문 텍스트 | `--color-text` | #1B2433 |
| 보조 / 옅은 텍스트 | `--color-text-muted` / `--color-text-subtle` | #69748A / #9AA3B4 |
| 표면 / 보조표면 | `--color-surface` / `--color-surface-alt` | #FFFFFF / #F5F7FB |
| 경계선 / 강조선 | `--color-border` / `--color-border-strong` | #E8EDF4 / #DDE3EC |
| 페이지 배경 | `--color-canvas` (+`--grad-hero`) | #F4F7FC |
| 성공 / 위험 | `--color-success` / `--color-danger` | #12A06A / #E0464B |

원시 팔레트는 `--blue-50…700`, `--amber-50…600`, `--n-0…900`(중성), `--green/red-50/500`로 단계화되어 있고, 위 시맨틱 토큰이 이를 참조한다.
규칙: 강조는 Primary, 포인트·뱃지·하이라이트만 Accent. Accent를 넓은 면적에 쓰지 않는다(시선 분산).

## 3. 타이포그래피

- 글꼴: `--font-sans` (Pretendard 우선)
- 사이즈 스케일: `--fs-display`(44) · `--fs-h1`(32) · `--fs-h2`(24) · `--fs-h3`(20) · `--fs-lg`(17) · `--fs-base`(15) · `--fs-sm`(13) · `--fs-xs`(12)
- 행간: `--lh-tight`(1.15, 제목) · `--lh-snug`(1.35) · `--lh-normal`(1.6, 본문)
- 자간(tracking): 제목은 `--tracking-tight`(-.022em)로 조여 또렷하게, 본문은 약 -.003em, 라벨/대문자는 `--tracking-wide`(.06em)
- 굵기: `--w-regular`400 / `--w-medium`500 / `--w-semibold`600 / `--w-bold`700 / `--w-black`800

## 4. 라운드 · 그림자 · 간격 · 모션

- 라운드: `--radius-xs`6 · `--radius-sm`10 · `--radius-md`12 · `--radius-lg`16(카드) · `--radius-xl`22 · `--radius-pill`
- 그림자(중성 다층, 은은하게): `--shadow-xs/sm/card/pop`. **파란 그림자 지양** — Primary CTA에만 `--shadow-primary` 사용. (v2에서 파란 그림자 → 중성으로 정제)
- 간격(4px 베이스): `--sp-1`(4) ~ `--sp-20`(80). 컴포넌트 내부 패딩 12~16px, 섹션 간 `--sp-10`(40)~`--sp-12`(48)
- 모션: `--ease`(표준) / `--ease-out`(진입) · `--dur-1`.12s / `--dur-2`.2s / `--dur-3`.32s. hover 이동은 1~4px + 그림자 한 단계 상승
- z-index: `--z-nav`50 / `--z-overlay`100 / `--z-toast`200

## 5. 컴포넌트 상태 규칙

| 컴포넌트 | 기본 | hover | focus | disabled |
|---|---|---|---|---|
| Primary 버튼 | bg `--color-primary`, 텍스트 onPrimary, radius pill | bg `--color-primary-hover` | outline `--color-ring` 2px | opacity .5, 커서 not-allowed |
| Secondary 버튼 | surface + border | border `--color-primary`, 텍스트 primary | ring | opacity .5 |
| 카드 | surface, radius-lg, shadow-card | translateY(-2px)+shadow-pop | — | — |
| 인풋 | border, radius-md | border `--slate-300` | border primary + ring | surface-alt |
| 뱃지/칩 | primary-soft 배경 + primary 텍스트 | — | — | — |

포커스 링은 접근성 필수(키보드 사용자). 절대 `outline:none`만 주지 않는다.

## 6. Tailwind 매핑 (tailwind.config.ts)

```ts
// 토큰을 유틸클래스로 노출 → bg-primary, text-muted, rounded-card 등
export default {
  theme: {
    extend: {
      colors: {
        primary:   'var(--color-primary)',
        'primary-hover':'var(--color-primary-hover)',
        accent:    'var(--color-accent)',
        ink:       'var(--color-text)',
        muted:     'var(--color-text-muted)',
        subtle:    'var(--color-text-subtle)',
        surface:   'var(--color-surface)',
        'surface-alt':'var(--color-surface-alt)',
        border:    'var(--color-border)',
        success:   'var(--color-success)',
        danger:    'var(--color-danger)',
      },
      borderRadius:{ sm:'var(--radius-sm)', md:'var(--radius-md)', card:'var(--radius-lg)', xl:'var(--radius-xl)', pill:'var(--radius-pill)' },
      boxShadow:{ sm:'var(--shadow-sm)', card:'var(--shadow-card)', pop:'var(--shadow-pop)', primary:'var(--shadow-primary)' },
      fontSize:{ display:'var(--fs-display)', h1:'var(--fs-h1)', h2:'var(--fs-h2)', h3:'var(--fs-h3)', base:'var(--fs-base)', sm:'var(--fs-sm)', xs:'var(--fs-xs)' },
      spacing:{ 1:'var(--sp-1)',2:'var(--sp-2)',3:'var(--sp-3)',4:'var(--sp-4)',5:'var(--sp-5)',6:'var(--sp-6)',8:'var(--sp-8)',10:'var(--sp-10)',12:'var(--sp-12)' },
      transitionTimingFunction:{ DEFAULT:'var(--ease)', out:'var(--ease-out)' },
      fontFamily:{ sans:'var(--font-sans)' },
    },
  },
}
```

사용 예: `<button class="bg-primary text-white rounded-pill px-5 py-3 shadow-primary hover:bg-primary-hover">`

## 7. Do / Don't

- ✅ 색은 항상 토큰(`--color-*` / `bg-primary`)으로. ❌ `#2563eb` 직접 입력 금지.
- ✅ 그림자는 중성 다층(`--shadow-card/sm/pop`), Primary CTA만 `--shadow-primary`. ❌ 진하거나 컬러가 과한 그림자.
- ✅ Accent는 포인트만. ❌ 버튼·배경 전반을 앰버로 도배.
- ✅ 제목은 `--tracking-tight`로 조이고 본문은 1.6 행간. ❌ 자간/행간 방치한 밋밋한 텍스트.
- ✅ 모든 인터랙티브 요소에 focus 링. ❌ `outline:none` 단독.
- ✅ 다크모드는 토큰 덮어쓰기(`[data-theme="dark"]`). ❌ 컴포넌트마다 분기.

## 8. 확장

새 컴포넌트/패턴은 (1) 기존 토큰으로 가능한지 먼저 확인 → (2) 부족하면 토큰을 추가(원시→시맨틱 순) → (3) 이 문서에 상태표 1행 추가. 토큰 없이 값부터 박지 않는다.

## 9. v3 변경 (UI 디테일 · 설계 고도화)

**토큰 추가** (`tokens.css`)
- 엘리베이션: `--shadow-lg`, `--shadow-inset`. 글래스: `--glass-bg/-border`, `--blur-nav`.
- 그라데이션: `--grad-amber`, `--grad-mesh`(히어로 다색 라이트, `color-mix` 사용).
- 모션: `--ease-spring`(튕김 진입), `--dur-4`. 레이아웃: `--container-wide`(1240), z-index `--z-sticky`.

**다크모드 정식 적용**
- `[data-theme="dark"]`를 실제 활성화(주석 해제). primary/accent/상태색/그림자/글래스까지 토큰으로 전부 재매핑.
- 적용 방식: 각 페이지 `<head>`에 FOUC 방지 인라인 스니펫(localStorage `epic-theme` 또는 OS 선호 → 페인트 전 적용). 토글은 `app.js`의 `toggleTheme()`/`.theme-toggle` 버튼.
- `prefers-reduced-motion` 존중(애니메이션/트랜지션 비활성) 추가.

**공용 컴포넌트 추가** (`app.css`)
- 레이아웃/타이포: `.kicker`, `.h-center`, `.divider`, `.container.wide`.
- 히어로: `.hero`(+mesh bg, `.hl` 형광 밑줄), `.hero-search`, `.hero-tags`.
- 데이터: `.stats`(카운트업 `[data-count]`), `.marquee`(무한 흐름), `.steps`(번호 로드맵).
- 카드류: `.feat`, `.tutor`+`.avatar`, `.review`(별점), `.cc .lv`(레벨 뱃지) + 썸네일 hover 줌.
- 인터랙션: `.acc`(아코디언, grid-rows 트랜지션), `.segment`(세그먼트 컨트롤), `.checks`(체크리스트), `.cta`(밴드), `[data-reveal]`(스크롤 등장), `.skel`(스켈레톤).
- 내비/모바일: `.theme-toggle`, `.menu-btn`+`.drawer`(모바일 메뉴), `.mcta`(모바일 하단 고정 CTA), `.foot.big`(멀티컬럼).

**JS 인터랙션 추가** (`app.js`): 테마 토글(+기억), `IntersectionObserver` 스크롤 리빌, 숫자 카운트업(easeOutCubic), 아코디언 토글, 세그먼트 토글, 모바일 드로어.

**적용 페이지**: `home`(랜딩 전면 리뉴얼·컨텐츠 확장), `course`(아코디언 커리큘럼·체크리스트·FAQ·추천강의·모바일 CTA). 전 페이지 다크모드 대응.

---

## 8. v4 — SaaS Product 진화 (Linear / Vercel / Stripe 톤)

마켓플레이스 톤 → **프로덕트(플랫폼) 톤**으로 격상. 브랜드를 "영어 학습 플랫폼/학습 OS"로 재포지셔닝.

**아이덴티티 변화**
- Primary 재매핑: 블루(#2563EB) → **인디고 #6366F1**(hover #5145E5). 2차 액센트 **바이올렛 #8B5CF6**. amber는 뱃지 보조로 잔존.
- 시그니처 그라데이션: `--grad-primary`(인디고→바이올렛), `--grad-iris`(인디고→바이올렛→시안), `--grad-text`(헤드라인 그라데이션 텍스트).
- 다크모드: 네이비 → **뉴트럴 니어블랙 #08080C**(Vercel/Linear 톤) + 인디고 글로우.
- 타이포: 히어로 `clamp(2.6→4.25rem)`, tracking `-.035em`. 모노 폰트 토큰(`--font-mono`) 추가.
- 배경: 전역 미세 **그리드 패턴**(`--pattern-grid`) + 상단 **오로라 글로우 블롭**(`body::before/::after`).

**신규 컴포넌트** (`app.css` v4)
- `.gradient-text` / `.eyebrow`(dot+pill) / `.mono` — 시그니처 텍스트·라벨.
- `.gborder` — 그라데이션 보더 래퍼(mask 합성). `.btn-grad`(sheen 애니), `.btn-soft`, `.btn-glass`.
- `.gnb.saas` — pill 내비 + 그라데이션 로고 마크(`.ico.mark`).
- `.hero.saas` / `.hero-cta` / `.hero-meta` — SaaS 히어로.
- `.frame`(브라우저/앱 목업 창) + `.mock`(미니 플레이어 UI: 진행바·레슨 리스트).
- `.cloud`(그레이스케일 로고 클라우드).
- `.bento`(6컬럼 벤토 그리드, `.w2/w3/w4/w6/.h2` 스팬) + 데코(`.spark` 미니차트, `.ring` 도넛게이지).
- `.spot` — 포인터 추적 **스포트라이트 글로우**(JS `initSpotlight`, 터치기기 제외).
- `.pricing`/`.plan`(`.pop` 강조, `.was` 정가취소선) — 3티어 요금제.
- `.cta.saas` — 니어블랙+오로라 CTA 밴드. `.rule`(라벨 디바이더).

**적용 페이지**: `home`(SaaS 랜딩 전면 재구성 — 오로라 히어로+그라데이션 헤드라인 → 프로덕트 목업 프레임 → 로고 클라우드 → 벤토 기능 → 통계 → 작동방식 → 강의 → 후기 → 요금제 → 오로라 CTA), `course`(SaaS 내비·그라데이션 CTA·그라데이션 보더 구매카드). 토큰 재매핑으로 전 페이지 자동 반영.

규칙 유지: hex 하드코딩 금지, 토큰만 참조. 넓은 면적엔 그라데이션 1개만(시선 분산 방지).
