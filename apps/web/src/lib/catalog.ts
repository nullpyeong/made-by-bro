/* ===== 강의 카탈로그 + 결제 플랜 데이터 (cart/checkout 공유) =====
 * docs/pages/app.js 의 CATALOG / CHECKOUT / RECOS 를 그대로 옮김.
 * 이미지 경로만 Vite public(/assets/...) 기준으로 변환.
 */

export type CatalogEntry = {
  img?: string
  cls?: string
  label: string
  sub: string
  price: string
}

export const CATALOG: Record<string, CatalogEntry> = {
  '초·중등 데일리 영어회화 30일': {
    img: '/assets/course-conversation.jpg',
    label: '회화',
    sub: '김하영 원장 · 수강기간 90일 · 13강',
    price: '₩66,000',
  },
  '기초 영문법 완성': {
    img: '/assets/course-grammar.jpg',
    label: '문법',
    sub: '김하영 원장 · 수강기간 90일 · 24강',
    price: '₩48,000',
  },
  '중등 내신 영어 완성': {
    img: '/assets/course-exam.jpg',
    label: '내신',
    sub: '김하영 원장 · 수강기간 120일 · 32강',
    price: '₩55,000',
  },
  '초등 영어 파닉스': {
    cls: 'gx-teal',
    label: 'PHONICS',
    sub: '김하영 원장 · 수강기간 90일 · 20강',
    price: '무료',
  },
  '중등 독해·어휘 부스터': {
    img: '/assets/course-reading.jpg',
    label: '독해·어휘',
    sub: '김하영 원장 · 수강기간 90일 · 26강',
    price: '₩52,000',
  },
  '원어민 발음 클리닉': {
    img: '/assets/course-speaking.jpg',
    label: '발음',
    sub: '김하영 원장 · 수강기간 60일 · 18강',
    price: '₩72,000',
  },
  '초등 영어 첫걸음반': {
    img: '/assets/course-starter.jpg',
    label: '첫걸음',
    sub: '김하영 원장 · 수강기간 90일 · 22강',
    price: '₩42,000',
  },
  '중등 서술형 영작 기초': {
    img: '/assets/course-writing.jpg',
    label: '영작',
    sub: '김하영 원장 · 수강기간 90일 · 20강',
    price: '₩50,000',
  },
}

export const RECOS = ['초·중등 데일리 영어회화 30일', '기초 영문법 완성', '중등 독해·어휘 부스터']

export type CheckoutPlan = {
  title: string
  thumbCls: string
  thumbLabel: string
  name: string
  sub: string // HTML 허용
  unit: string // HTML 허용
  unitsub: string
  upsell: boolean
  sumhead: string
  row1k: string
  row1v: string
  disck: string
  discv: string
  row2k: string
  row2v: string
  totalk: string
  base: string
  disc: string
  saveToast: string
  cta: string
  trust: string[] // HTML 허용
  notice: string
}

export const CHECKOUT: Record<'single' | 'membership', CheckoutPlan> = {
  single: {
    title: '결제 · EPIC',
    thumbCls: 'gx-blue',
    thumbLabel: '회화',
    name: '초·중등 데일리 영어회화 30일',
    sub: '김하영 원장 · 수강기간 <b style="color:var(--color-text)">90일</b> · 13강',
    unit: '₩66,000',
    unitsub: '단건 구매 · 90일',
    upsell: true,
    sumhead: '결제 금액',
    row1k: '상품 금액',
    row1v: '₩66,000',
    disck: '쿠폰 할인 (WELCOME15 · 15%)',
    discv: '-₩9,900',
    row2k: '수강기간',
    row2v: '90일',
    totalk: '최종 결제',
    base: '₩66,000',
    disc: '₩56,100',
    saveToast: '쿠폰 WELCOME15 적용 — 9,900원 할인',
    cta: '결제하기',
    trust: [
      '<i class="icn icn-lock"></i> 안전결제',
      '<i class="icn icn-check"></i> 7일 환불보장',
      '<i class="icn icn-phone"></i> 즉시 수강',
    ],
    notice:
      '환불 안내: 수강 1/3 경과 전 2/3 환급, 1/2 경과 전 1/2 환급, 1/2 경과 후 환급 불가 (학원법 기준). 결제 시 약관·환불정책에 동의합니다.',
  },
  membership: {
    title: '멤버십 결제 · EPIC',
    thumbCls: 'gx-indigo',
    thumbLabel: '전 과목',
    name: '전 과목 멤버십',
    sub: '전 강의 무제한 · 매월 신규 강의 자동 포함 · <b style="color:var(--color-text)">약정 없음</b>',
    unit: '₩16,900<small style="font-size:11px;font-weight:600;color:var(--color-text-muted)"> /월</small>',
    unitsub: '월 자동결제 · 언제든 해지',
    upsell: false,
    sumhead: '월 결제 금액',
    row1k: '멤버십 (월)',
    row1v: '₩16,900',
    disck: '첫 달 할인 (WELCOME15 · 15%)',
    discv: '-₩2,535',
    row2k: '결제 주기',
    row2v: '매월 자동',
    totalk: '오늘 결제 (첫 달)',
    base: '₩16,900',
    disc: '₩14,365',
    saveToast: '쿠폰 WELCOME15 적용 — 첫 달 2,535원 할인',
    cta: '멤버십 시작',
    trust: [
      '<i class="icn icn-lock"></i> 안전결제',
      '<i class="icn icn-refresh"></i> 언제든 해지',
      '<i class="icn icn-phone"></i> 즉시 수강',
    ],
    notice:
      '멤버십은 매월 ₩16,900이 자동결제되며, 마이페이지에서 언제든 해지할 수 있어요. 해지해도 다음 결제일까지는 모든 강의를 계속 이용할 수 있습니다.',
  },
}

export function parseWon(s?: string): number {
  if (!s) return 0
  if (/무료/.test(String(s))) return 0
  const n = parseInt(String(s).replace(/[^0-9]/g, ''), 10)
  return isNaN(n) ? 0 : n
}
export function formatWon(n: number): string {
  return '₩' + Number(n).toLocaleString('en-US')
}
