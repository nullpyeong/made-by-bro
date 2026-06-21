/* ===== EPIC 공용 인터랙션 — docs/pages/app.js 의 횡단 동작을 React로 포팅 =====
 * 정적 마케팅 화면은 app.js와 동일하게 className/data-attr 토글로 동작한다.
 * (테마=documentElement 속성, 드로어/아코디언/칩=class 토글, 장바구니=localStorage+배지)
 * React는 마크업(JSX)만 렌더하고, AppShell이 아래 init들을 effect로 연결한다.
 */

import { logout as apiLogout } from './api'

type NavigateFn = (to: string) => void

/* ----- toast ----- */
let _toastT: ReturnType<typeof setTimeout> | undefined
export function toast(msg: string) {
  let t = document.querySelector<HTMLDivElement>('.toast')
  if (!t) {
    t = document.createElement('div')
    t.className = 'toast'
    document.body.appendChild(t)
  }
  t.textContent = msg
  t.classList.add('show')
  clearTimeout(_toastT)
  _toastT = setTimeout(() => t!.classList.remove('show'), 2200)
}

/* ----- 테마 (라이트/다크, localStorage 기억) ----- */
export function applyTheme(t: string) {
  if (t === 'dark') document.documentElement.setAttribute('data-theme', 'dark')
  else document.documentElement.removeAttribute('data-theme')
}
export function initTheme() {
  let t: string | null = null
  try {
    // 구버전 키 1회성 정리(다크 고착 방지)
    if (localStorage.getItem('epic-reset3') !== '1') {
      localStorage.removeItem('epic-theme')
      localStorage.removeItem('epic-theme-v2')
      localStorage.setItem('epic-reset3', '1')
    }
    t = localStorage.getItem('epic-theme-v2')
  } catch (e) {}
  // Friendly Bright = 기본은 항상 라이트. 다크는 사용자가 토글했을 때만.
  applyTheme(t === 'dark' ? 'dark' : 'light')
}
export function toggleTheme() {
  const dark = document.documentElement.getAttribute('data-theme') === 'dark'
  const next = dark ? 'light' : 'dark'
  applyTheme(next)
  try {
    localStorage.setItem('epic-theme-v2', next)
  } catch (e) {}
  toast(next === 'dark' ? '다크 모드' : '라이트 모드')
}
// FOUC 최소화: 모듈 로드 즉시 1차 적용
initTheme()

/* ----- 장바구니 (localStorage + 내비 배지) ----- */
const CART_KEY = 'epic-cart-v1'
export type CartItem = { name: string; price: string }
export function getCart(): CartItem[] {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY) || '[]') || []
  } catch (e) {
    return []
  }
}
function setCart(arr: CartItem[], pop?: boolean) {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(arr))
  } catch (e) {}
  updateCartBadges(pop)
}
export function addToCart(item: CartItem): boolean {
  const c = getCart()
  if (c.some((x) => x.name === item.name)) return false
  c.push(item)
  setCart(c, true)
  return true
}
export function clearCart() {
  setCart([], false)
}
export function removeFromCart(name: string) {
  setCart(
    getCart().filter((x) => x.name !== name),
    false,
  )
}
export function updateCartBadges(pop?: boolean) {
  const n = getCart().length
  document.querySelectorAll<HTMLElement>('[data-cartcount-badge]').forEach((b) => {
    b.textContent = String(n)
    b.hidden = n === 0
    if (pop) {
      b.classList.remove('pop')
      // reflow로 애니 재시작
      void b.offsetWidth
      b.classList.add('pop')
    }
  })
}

/* ----- 전역 클릭 위임 (app.js DOMContentLoaded 위임 블록 포팅) ----- */
export function mountGlobalHandlers(navigate: NavigateFn): () => void {
  const onClick = (e: MouseEvent) => {
    const target = e.target as HTMLElement

    // 아코디언 헤더(커리큘럼/FAQ)
    const hd = target.closest('.acc>.hd')
    if (hd) {
      hd.parentElement!.classList.toggle('open')
      return
    }

    // 라디오 옵션 카드 — 그룹 내 단일 선택
    const rc = target.closest<HTMLElement>('[data-radio]')
    if (rc) {
      const g = rc.closest('[data-radiogroup]') || rc.parentElement!
      g.querySelectorAll('[data-radio]').forEach((x) => x.classList.remove('on'))
      rc.classList.add('on')
      return
    }

    const el = target.closest<HTMLElement>('[data-act], .chip, .tab, .quiz-opt')
    if (!el) return

    // 칩 그룹 토글
    if (el.classList.contains('chip')) {
      const group = el.parentElement!
      group.querySelectorAll('.chip').forEach((c) => c.classList.remove('on'))
      el.classList.add('on')
      return
    }
    // 탭 전환
    if (el.classList.contains('tab')) {
      const tabs = el.parentElement!
      tabs.querySelectorAll('.tab').forEach((t) => t.classList.remove('on'))
      el.classList.add('on')
      const key = el.dataset.tab
      if (key) {
        const scope = tabs.closest('[data-tabscope]') || document
        scope.querySelectorAll<HTMLElement>('[data-panel]').forEach((p) => {
          p.style.display = p.dataset.panel === key ? '' : 'none'
        })
      }
      return
    }
    // 퀴즈 응답(미리보기)
    if (el.classList.contains('quiz-opt')) {
      const box = el.closest('.quiz')!
      box.querySelectorAll('.quiz-opt').forEach((o) => o.classList.remove('btn-primary'))
      if (el.dataset.correct === '1') {
        el.classList.add('btn-primary')
        toast('정답입니다. 이어서 재생합니다')
        const ov = document.querySelector<HTMLElement>('.quiz-overlay')
        if (ov) setTimeout(() => (ov.style.display = 'none'), 700)
      } else {
        toast('다시 시도해보세요')
      }
      return
    }

    const act = el.dataset.act
    if (act === 'toast') {
      toast(el.dataset.msg || '준비 중입니다')
    } else if (act === 'add-cart') {
      e.preventDefault() // 카드(<a>) 안의 담기 버튼이 페이지를 이동시키지 않도록
      if (el.dataset.added === '1') {
        navigate('/cart')
        return
      }
      const added = addToCart({ name: el.dataset.name || '강의', price: el.dataset.price || '' })
      el.dataset.added = '1'
      if (el.classList.contains('cc-add')) {
        el.classList.add('added')
        el.innerHTML = '<i class="icn icn-check"></i>'
        el.setAttribute('aria-label', '장바구니 보기')
      } else if (el.dataset.swap === '0') {
        el.textContent = '장바구니 보기 →'
      } else {
        el.innerHTML = '<i class="icn icn-check"></i> 담김 · 장바구니 보기 <span class="arr">→</span>'
      }
      toast(added ? '장바구니에 담았어요 (' + getCart().length + ')' : '이미 장바구니에 있어요')
    } else if (act === 'buy-now') {
      e.preventDefault()
      addToCart({ name: el.dataset.name || '강의', price: el.dataset.price || '' })
      navigate('/checkout')
    } else if (act === 'expand-all') {
      const tools = el.closest('.curtools')
      const panel = el.closest('[data-panel]') || document
      const accs = panel.querySelectorAll('.acc')
      const open = !!(tools && tools.classList.toggle('allopen'))
      accs.forEach((a) => a.classList.toggle('open', open))
      const tx = el.querySelector('.tx')
      if (tx) tx.textContent = open ? '모두 접기' : '모두 펼치기'
    } else if (act === 'modal-open') {
      const m = document.getElementById(el.dataset.target || '')
      if (m) m.style.display = 'flex'
    } else if (act === 'modal-close') {
      const m = el.closest<HTMLElement>('[data-modal]')
      if (m) m.style.display = 'none'
    } else if (act === 'theme') {
      toggleTheme()
    } else if (act === 'logout') {
      e.preventDefault()
      apiLogout().finally(() => {
        toast('로그아웃되었습니다')
        navigate('/login')
      })
    } else if (act === 'menu') {
      const d = document.getElementById('drawer')
      if (d) d.classList.add('open')
    } else if (act === 'menu-close') {
      const d = el.closest('.drawer')
      if (d) d.classList.remove('open')
    }
  }

  const onSegment = (e: MouseEvent) => {
    const t = e.target as HTMLElement
    const s = t.closest('.segment .seg')
    if (s) {
      s.parentElement!.querySelectorAll('.seg').forEach((x) => x.classList.remove('on'))
      s.classList.add('on')
      return
    }
    // 관리자 차트 기간 토글(.seg2)
    const b = t.closest('.seg2 button')
    if (b) {
      b.parentElement!.querySelectorAll('button').forEach((x) => x.classList.remove('on'))
      b.classList.add('on')
    }
  }
  const onDrawerOutside = (e: MouseEvent) => {
    const d = document.getElementById('drawer')
    if (d && d.classList.contains('open') && e.target === d) d.classList.remove('open')
  }

  document.addEventListener('click', onClick)
  document.addEventListener('click', onSegment)
  document.addEventListener('click', onDrawerOutside)
  return () => {
    document.removeEventListener('click', onClick)
    document.removeEventListener('click', onSegment)
    document.removeEventListener('click', onDrawerOutside)
  }
}

/* ----- 페이지별 효과 (라우트 변경마다 재무장) ----- */
export function armPageEffects(): () => void {
  const cleanups: Array<() => void> = []

  // 스크롤 리빌
  const revealEls = document.querySelectorAll<HTMLElement>('[data-reveal],[data-stagger]')
  if (revealEls.length) {
    if (!('IntersectionObserver' in window)) {
      revealEls.forEach((e) => e.classList.add('in'))
    } else {
      const io = new IntersectionObserver(
        (ents) => {
          ents.forEach((en) => {
            if (en.isIntersecting) {
              en.target.classList.add('in')
              io.unobserve(en.target)
            }
          })
        },
        { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
      )
      revealEls.forEach((e) => io.observe(e))
      cleanups.push(() => io.disconnect())
    }
  }

  // 숫자 카운트업
  const countEls = document.querySelectorAll<HTMLElement>('[data-count]')
  if (countEls.length) {
    const run = (el: HTMLElement) => {
      const to = parseFloat(el.dataset.count || '0')
      const dec = parseInt(el.dataset.dec || '0', 10) || 0
      const suf = el.dataset.suf || ''
      const t0 = performance.now()
      const dur = 1100
      const tick = (now: number) => {
        const p = Math.min(1, (now - t0) / dur)
        const e = 1 - Math.pow(1 - p, 3)
        el.textContent = (to * e).toFixed(dec).replace(/\B(?=(\d{3})+(?!\d))/g, ',') + suf
        if (p < 1) requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
    }
    if (!('IntersectionObserver' in window)) {
      countEls.forEach(run)
    } else {
      const io = new IntersectionObserver(
        (ents) => {
          ents.forEach((en) => {
            if (en.isIntersecting) {
              run(en.target as HTMLElement)
              io.unobserve(en.target)
            }
          })
        },
        { threshold: 0.4 },
      )
      countEls.forEach((e) => io.observe(e))
      cleanups.push(() => io.disconnect())
    }
  }

  // 스포트라이트(.spot — 포인터 추적 글로우)
  const spots = document.querySelectorAll<HTMLElement>('.spot')
  if (spots.length && !matchMedia('(hover:none)').matches) {
    spots.forEach((el) => {
      const onMove = (e: PointerEvent) => {
        const r = el.getBoundingClientRect()
        el.style.setProperty('--mx', e.clientX - r.left + 'px')
        el.style.setProperty('--my', e.clientY - r.top + 'px')
      }
      el.addEventListener('pointermove', onMove)
      cleanups.push(() => el.removeEventListener('pointermove', onMove))
    })
  }

  // 내비 스크롤 섀도
  const nav = document.querySelector<HTMLElement>('.gnb')
  if (nav) {
    const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 6)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    cleanups.push(() => window.removeEventListener('scroll', onScroll))
  }

  return () => cleanups.forEach((c) => c())
}
