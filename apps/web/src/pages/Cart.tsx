import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CATALOG, CHECKOUT, RECOS, parseWon, formatWon } from '../lib/catalog'
import { addToCart, getCart, removeFromCart, clearCart, updateCartBadges, toast } from '../lib/interactions'

/** 장바구니 — 단건(localStorage 목록 렌더 + 합계) / 멤버십(단일 라인) 분기.
 * app.js 의 initCart/renderCart/renderRecos 를 React state로 재구성. */

const SNAP_KEY = 'epic-cart-snap'

function Thumb({ name }: { name: string }) {
  const c = CATALOG[name] || { label: '강의' }
  if (c.img) return <div className="cth" style={{ backgroundImage: `url(${c.img})` }} />
  return <div className={`cth ${c.cls || 'gx-blue'}`}>{c.label}</div>
}

function ThumbSm({ name }: { name: string }) {
  const c = CATALOG[name] || { label: '강의' }
  if (c.img) return <div className="cth sm" style={{ backgroundImage: `url(${c.img})` }} />
  return <div className={`cth sm ${c.cls || 'gx-blue'}`}>{c.label}</div>
}

function priceLabel(name: string) {
  const c = CATALOG[name]
  const p = c?.price || ''
  return parseWon(p) === 0 ? <span style={{ color: 'var(--green-500)' }}>무료</span> : p
}

export default function Cart() {
  const [params] = useSearchParams()
  const plan = params.get('plan') === 'membership' ? 'membership' : 'single'

  // 단건: localStorage 목록 상태 (없으면 기본 강의 1개 시드)
  const [items, setItems] = useState<string[]>(() => {
    if (plan === 'membership') return []
    const cur = getCart()
    if (cur.length === 0) {
      addToCart({ name: CHECKOUT.single.name, price: CHECKOUT.single.base })
      return [CHECKOUT.single.name]
    }
    return cur.map((x) => x.name)
  })
  const [couponApplied, setCouponApplied] = useState(false)
  const [newItems, setNewItems] = useState<string[]>([])
  const newRef = useRef<HTMLDivElement | null>(null)

  // "다른 강의 더 담기"로 나갔다 돌아왔으면, 새로 담긴 강의 강조
  useEffect(() => {
    if (plan === 'membership') return
    try {
      const snap = sessionStorage.getItem(SNAP_KEY)
      if (snap !== null) {
        const before: string[] = JSON.parse(snap) || []
        const now = getCart().map((x) => x.name)
        setNewItems(now.filter((n) => before.indexOf(n) < 0))
        sessionStorage.removeItem(SNAP_KEY)
      }
    } catch (e) {}
  }, [plan])

  // 강조 항목으로 스크롤(1회성)
  useEffect(() => {
    if (newItems.length && newRef.current?.scrollIntoView) {
      newRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [newItems])

  document.title = (plan === 'membership' ? '장바구니 · 멤버십' : '장바구니') + ' · EPIC'

  /* ----- 멤버십 분기 ----- */
  if (plan === 'membership') {
    const C = CHECKOUT.membership
    return (
      <CartShell
        count={1}
        left={
          <div className="cartlist">
            <div className="cartitem">
              <div className={`cth ${C.thumbCls}`}>{C.thumbLabel}</div>
              <div className="cartinfo">
                <div className="ti">{C.name}</div>
                <div
                  className="muted"
                  style={{ fontSize: 12.5, marginTop: 3 }}
                  dangerouslySetInnerHTML={{ __html: C.sub }}
                />
              </div>
              <div style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                <div className="cartprice" dangerouslySetInnerHTML={{ __html: C.unit }} />
                <div className="muted" style={{ fontSize: 11, marginTop: 2 }}>
                  {C.unitsub}
                </div>
              </div>
            </div>
          </div>
        }
        right={
          <Summary
            rows={[{ k: C.row1k, v: C.row1v }]}
            discount={{ k: C.disck, v: C.discv, show: couponApplied }}
            totalk="첫 달 결제"
            total={couponApplied ? C.disc : C.base}
            onCoupon={() => {
              if (couponApplied) return
              setCouponApplied(true)
              toast(C.saveToast)
            }}
            couponApplied={couponApplied}
            proceedTo="/checkout?plan=membership"
          />
        }
      />
    )
  }

  /* ----- 단건 분기 ----- */
  const subtotal = items.reduce((s, n) => s + parseWon(CATALOG[n]?.price), 0)
  const discount = Math.round(subtotal * 0.15)
  const empty = items.length === 0

  const remove = (name: string) => {
    removeFromCart(name)
    setItems((prev) => prev.filter((n) => n !== name))
    toast('장바구니에서 삭제했어요')
  }
  const recoAdd = (name: string) => {
    addToCart({ name, price: CATALOG[name]?.price || '' })
    setItems((prev) => (prev.includes(name) ? prev : [...prev, name]))
    toast('장바구니에 담았어요')
  }
  const snapBeforeLeave = () => {
    try {
      sessionStorage.setItem(SNAP_KEY, JSON.stringify(getCart().map((x) => x.name)))
    } catch (e) {}
  }

  return (
    <CartShell
      count={items.length}
      left={
        <div>
          {empty ? (
          <div className="cart-empty">
            <span className="ico">
              <i className="icn icn-cart" />
            </span>
            <div style={{ fontWeight: 700, color: 'var(--color-text)', marginBottom: 4 }}>
              장바구니가 비었어요
            </div>
            <div style={{ fontSize: 13, marginBottom: 18 }}>
              아래 추천 강의를 바로 담거나, 전체 강의를 둘러보세요.
            </div>
            <div className="cart-recos">
              {RECOS.filter((n) => !items.includes(n)).map((n) => (
                <div className="reco" key={n}>
                  <ThumbSm name={n} />
                  <div className="reco-info">
                    <div className="ti">{n}</div>
                    <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
                      {priceLabel(n)}
                    </div>
                  </div>
                  <button className="btn btn-ghost btn-sm" onClick={() => recoAdd(n)}>
                    담기
                  </button>
                </div>
              ))}
            </div>
            <Link
              className="btn btn-grad"
              to="/#courses"
              onClick={snapBeforeLeave}
              style={{ marginTop: 6 }}
            >
              전체 강의 둘러보기 →
            </Link>
          </div>
        ) : (
          <>
            <div className="cartlist">
              {items.map((n) => {
                const isNew = newItems.indexOf(n) >= 0
                return (
                  <div
                    className={`cartitem${isNew ? ' is-new' : ''}`}
                    key={n}
                    ref={isNew && !newRef.current ? newRef : undefined}
                  >
                    <Thumb name={n} />
                    <div className="cartinfo">
                      <div className="ti">
                        {n}
                        {isNew && <span className="newbadge">방금 담음</span>}
                      </div>
                      <div className="muted" style={{ fontSize: 12.5, marginTop: 3 }}>
                        {CATALOG[n]?.sub}
                      </div>
                    </div>
                    <div className="cartprice">{priceLabel(n)}</div>
                    <button className="cartdel" onClick={() => remove(n)} aria-label="강의 삭제">
                      ×
                    </button>
                  </div>
                )
              })}
            </div>

            <div className="upsell" style={{ marginTop: 18 }}>
              <span>
                <i className="icn icn-bulb" />
              </span>
              <span>
                여러 과목을 들을 계획이면 <b>전 과목 멤버십 ₩16,900/월</b>이 더 이득이에요
              </span>
              <Link to="/#pricing">멤버십 보기 →</Link>
            </div>

            <Link className="cart-more" to="/#courses" onClick={snapBeforeLeave}>
              ＋ 다른 강의 더 담기
            </Link>
            </>
          )}
        </div>
      }
      right={
        <Summary
          disabled={empty}
          rows={[{ k: '상품 금액', v: formatWon(subtotal) }]}
          discount={{
            k: '쿠폰 할인 (WELCOME15 · 15%)',
            v: '-' + formatWon(discount),
            show: couponApplied,
          }}
          totalk="주문 금액"
          total={couponApplied ? formatWon(subtotal - discount) : formatWon(subtotal)}
          onCoupon={() => {
            if (couponApplied) return
            setCouponApplied(true)
            toast(CHECKOUT.single.saveToast)
          }}
          couponApplied={couponApplied}
          proceedTo="/checkout"
          onProceed={() => updateCartBadges()}
        />
      }
    />
  )
}

/* ===== 보조 컴포넌트 ===== */

function CartShell({
  count,
  left,
  right,
}: {
  count: number
  left: ReactNode
  right: ReactNode
}) {
  return (
    <>
      <div className="gnb">
        <div className="inner">
          <Link className="logo" to="/">
            <span className="ico mark">
              <svg viewBox="0 0 24 24" fill="#fff" aria-hidden="true">
                <path d="M9 7.3v9.4l7.2-4.7z" />
              </svg>
            </span>
            <span className="wm">
              <b>
                EPIC<em>.</em>
              </b>
              <i>에픽영어교습소</i>
            </span>
          </Link>
          <nav>
            <Link to="/">전체강의</Link>
            <Link to="/qna">Q&amp;A</Link>
          </nav>
          <div className="right">
            <button className="theme-toggle" data-act="theme" aria-label="다크모드 전환">
              <span className="moon">
                <i className="icn icn-moon" />
              </span>
              <span className="sun">
                <i className="icn icn-sun" />
              </span>
            </button>
            <Link to="/mypage">마이페이지</Link>
          </div>
        </div>
      </div>

      <div className="container" style={{ paddingTop: 32 }}>
        <div className="stepper">
          <span className="s on">
            <span className="n">1</span>
            <span className="tx">장바구니</span>
          </span>
          <span className="ln" />
          <span className="s">
            <span className="n">2</span>
            <span className="tx">주문/결제</span>
          </span>
          <span className="ln" />
          <span className="s">
            <span className="n">3</span>
            <span className="tx">수강 시작</span>
          </span>
        </div>
      </div>

      <div
        className="container"
        style={{
          display: 'grid',
          gridTemplateColumns: '1.5fr 1fr',
          gap: 28,
          alignItems: 'start',
          paddingBottom: 48,
        }}
      >
        <div>
          <h2 style={{ fontSize: 21, fontWeight: 800, marginBottom: 16 }}>
            장바구니{' '}
            <span className="muted" style={{ fontWeight: 600, fontSize: 15 }}>
              ({count})
            </span>
          </h2>
          {left}
        </div>
        {right}
      </div>
    </>
  )
}

function Summary({
  rows,
  discount,
  totalk,
  total,
  onCoupon,
  couponApplied,
  proceedTo,
  onProceed,
  disabled,
}: {
  rows: { k: string; v: string }[]
  discount: { k: string; v: string; show: boolean }
  totalk: string
  total: string
  onCoupon: () => void
  couponApplied: boolean
  proceedTo: string
  onProceed?: () => void
  disabled?: boolean
}) {
  return (
    <div
      className={`card gborder${disabled ? ' is-disabled' : ''}`}
      style={{ padding: 22, position: 'sticky', top: 84 }}
    >
      <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 14 }}>주문 요약</h3>
      <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
        <input className="input" placeholder="쿠폰 코드 (예: WELCOME15)" style={{ flex: 1 }} defaultValue="WELCOME15" />
        <button
          className={`btn ${couponApplied ? 'btn-primary' : 'btn-ghost'}`}
          onClick={onCoupon}
          disabled={couponApplied}
        >
          {couponApplied ? '적용됨' : '적용'}
        </button>
      </div>
      {rows.map((r) => (
        <div className="sumrow" key={r.k}>
          <span className="k">{r.k}</span>
          <span>{r.v}</span>
        </div>
      ))}
      {discount.show && (
        <div className="sumrow save" style={{ display: 'flex' }}>
          <span className="k">{discount.k}</span>
          <span className="v">{discount.v}</span>
        </div>
      )}
      <div className="sumrow total">
        <span>{totalk}</span>
        <span className="v">{total}</span>
      </div>
      <Link className="btn btn-grad btn-block" to={proceedTo} onClick={onProceed} style={{ marginTop: 16 }}>
        주문하고 결제하기 <span className="arr">→</span>
      </Link>
      <div className="trust">
        <span>
          <i className="icn icn-lock" /> 안전결제
        </span>
        <span>
          <i className="icn icn-check" /> 7일 환불보장
        </span>
        <span>
          <i className="icn icn-phone" /> 즉시 수강
        </span>
      </div>
      <div className="muted" style={{ fontSize: 11.5, marginTop: 13, textAlign: 'center', lineHeight: 1.7 }}>
        다음 단계에서 결제수단을 선택해요.
        <br />
        지금 결제되지 않아요.
      </div>
    </div>
  )
}
