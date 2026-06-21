/** @type {import('tailwindcss').Config} */
// EPIC web · Tailwind 설정 (SETUP.md §2 원안 정합)
// 원칙: 색/라운드/그림자/타이포는 design tokens(tokens.css)의 CSS 변수에 "브리지"한다.
// → 유틸(bg-primary, text-muted, rounded-card …)이 var(--…)로 해석되므로
//   [data-theme="dark"] 가 변수만 덮어쓰면 다크모드가 그대로 따라온다(디자인 SSOT 보존).
// preflight(기본 리셋)는 app.css가 이미 리셋을 갖고 있어 공존 기간 동안 끈다.
// app.css를 전부 retire하면 preflight:true 로 되돌릴 것.
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: ['selector', '[data-theme="dark"]'],
  corePlugins: { preflight: false },
  theme: {
    extend: {
      colors: {
        canvas: 'var(--color-canvas)',
        surface: {
          DEFAULT: 'var(--color-surface)',
          alt: 'var(--color-surface-alt)',
          2: 'var(--color-surface-2)',
        },
        fg: 'var(--color-text)',
        muted: 'var(--color-text-muted)',
        subtle: 'var(--color-text-subtle)',
        'on-primary': 'var(--color-text-onPrimary)',
        primary: {
          DEFAULT: 'var(--color-primary)',
          hover: 'var(--color-primary-hover)',
          active: 'var(--color-primary-active)',
          soft: 'var(--color-primary-soft)',
        },
        accent: {
          DEFAULT: 'var(--color-accent)',
          soft: 'var(--color-accent-soft)',
        },
        accent2: {
          DEFAULT: 'var(--color-accent2)',
          soft: 'var(--color-accent2-soft)',
        },
        border: {
          DEFAULT: 'var(--color-border)',
          strong: 'var(--color-border-strong)',
        },
        success: {
          DEFAULT: 'var(--color-success)',
          soft: 'var(--color-success-soft)',
        },
        danger: {
          DEFAULT: 'var(--color-danger)',
          soft: 'var(--color-danger-soft)',
        },
      },
      borderRadius: {
        xs: 'var(--radius-xs)',
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
        card: 'var(--radius-card)',
        pill: 'var(--radius-pill)',
      },
      boxShadow: {
        xs: 'var(--shadow-xs)',
        sm: 'var(--shadow-sm)',
        card: 'var(--shadow-card)',
        pop: 'var(--shadow-pop)',
        lg: 'var(--shadow-lg)',
        primary: 'var(--shadow-primary)',
        glow: 'var(--glow-primary)',
      },
      fontFamily: {
        sans: 'var(--font-sans)',
        mono: 'var(--font-mono)',
      },
      fontSize: {
        hero: 'var(--fs-hero)',
        display: 'var(--fs-display)',
        h1: 'var(--fs-h1)',
        h2: 'var(--fs-h2)',
        h3: 'var(--fs-h3)',
        lg: 'var(--fs-lg)',
        base: 'var(--fs-base)',
        sm: 'var(--fs-sm)',
        xs: 'var(--fs-xs)',
      },
      maxWidth: {
        container: 'var(--container)',
        'container-wide': 'var(--container-wide)',
      },
      height: { gnb: 'var(--gnb-h)' },
      ringColor: { DEFAULT: 'var(--color-ring)' },
      transitionTimingFunction: {
        DEFAULT: 'var(--ease)',
        out: 'var(--ease-out)',
        spring: 'var(--ease-spring)',
      },
      backgroundImage: {
        'grad-primary': 'var(--grad-primary)',
        'grad-iris': 'var(--grad-iris)',
        'grad-brand': 'var(--grad-brand)',
        'grad-amber': 'var(--grad-amber)',
        hero: 'var(--grad-hero)',
        mesh: 'var(--grad-mesh)',
        sheen: 'var(--grad-sheen)',
      },
    },
  },
  plugins: [],
}
