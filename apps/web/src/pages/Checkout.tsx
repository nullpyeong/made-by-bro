import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CATALOG, CHECKOUT, parseWon, formatWon } from '../lib/catalog'
import { getCart, toast } from '../lib/interactions'

/** 주문/결제 — 단건(장바구니 실제 목록 + 합계) / 멤버십(단일 라인) 분기.
 * app.js 의 initCheckout 을 React state로 재구성. 결제수단/현금영수증 라디오는
 * 전역 data-radio 핸들러(class 토글)로 동작. */

function Thumb({ name }: { name: string }) {
  const c = CATALOG[name] || { label: '강의' }
  if (c.img) return <div className="cth" style={{ backgroundImage: `url(${c.img})` }} />
  return <div className={`cth ${c.cls || 'gx-blue'}`}>{c.label}</div>
}

function priceLabel(name: string) {
  const c = CATALOG[name]
  const p = c?.price || ''
  return parseWon(p) === 0 ? <span style={{ color: 'var(--green-500)' }}>무료</span> : p
}

export default function Checkout() {
  const [params] = useSearchParams()
  const plan = params.get('plan') === 'membership' ? 'membership' : 'single'
  const C = CHECKOUT[plan]
  const [couponApplied, setCouponApplied] = useState(false)
  const backTo = '/cart' + (plan === 'membership' ? '?plan=membership' : '')
  const completeTo = '/complete' + (plan === 'membership' ? '?plan=membership' : '')
  document.title = C.title

  // 단건: 장바구니 실제 목록 + 합계
  const items = plan === 'single' ? (getCart().length ? getCart().map((x) => x.name) : [C.name]) : []
  const subtotal = items.reduce((s, n) => s + parseWon(CATALOG[n]?.price), 0)
  const discount = Math.round(subtotal * 0.15)

  // 요약 행 (플랜별)
  let sumhead: string, row1k: string, row1v: string, disck: string, discv: string
  let row2k: string, row2v: string, totalk: string, base: string, disc: string
  if (plan === 'membership') {
    sumhead = C.sumhead
    row1k = C.row1k
    row1v = C.row1v
    disck = C.disck
    discv = C.discv
    row2k = C.row2k
    row2v = C.row2v
    totalk = C.totalk
    base = C.base
    disc = C.disc
  } else {
    sumhead = '결제 금액'
    row1k = items.length > 1 ? `상품 금액 (${items.length}개)` : '상품 금액'
    row1v = formatWon(subtotal)
    disck = C.disck
    discv = '-' + formatWon(discount)
    row2k = '강의 수'
    row2v = items.length + '개'
    totalk = '최종 결제'
    base = formatWon(subtotal)
    disc = formatWon(subtotal - discount)
  }

  const onCoupon = () => {
    if (couponApplied) return
    setCouponApplied(true)
    toast(plan === 'membership' ? C.saveToast : `쿠폰 WELCOME15 적용 — ${formatWon(discount)} 할인`)
  }

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
          <Link className="s done" to={backTo}>
            <span className="n">
              <i className="icn icn-check" />
            </span>
            <span className="tx">장바구니</span>
          </Link>
          <span className="ln fill" />
          <span className="s on">
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
        {/* 좌 */}
        <div>
          <h2 style={{ fontSize: 21, fontWeight: 800, marginBottom: 16 }}>주문 / 결제</h2>

          <div className="cartlist" style={{ marginBottom: 24 }}>
            {plan === 'membership' ? (
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
            ) : (
              items.map((n) => (
                <div className="cartitem" key={n}>
                  <Thumb name={n} />
                  <div className="cartinfo">
                    <div className="ti">{n}</div>
                    <div className="muted" style={{ fontSize: 12.5, marginTop: 3 }}>
                      {CATALOG[n]?.sub}
                    </div>
                  </div>
                  <div className="cartprice">{priceLabel(n)}</div>
                </div>
              ))
            )}
          </div>

          {C.upsell && (
            <div className="upsell" style={{ marginBottom: 24 }}>
              <span>
                <i className="icn icn-bulb" />
              </span>
              <span>
                여러 과목을 들을 계획이면 <b>전 과목 멤버십 ₩16,900/월</b>이 더 이득이에요
              </span>
              <Link to="/#pricing">멤버십 보기 →</Link>
            </div>
          )}

          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 9 }}>쿠폰</h3>
          <div style={{ display: 'flex', gap: 8, marginBottom: 26 }}>
            <input
              className="input"
              placeholder="쿠폰 코드 (예: WELCOME15)"
              style={{ flex: 1 }}
              defaultValue="WELCOME15"
            />
            <button
              className={`btn ${couponApplied ? 'btn-primary' : 'btn-ghost'}`}
              onClick={onCoupon}
              disabled={couponApplied}
            >
              {couponApplied ? '적용됨' : '적용'}
            </button>
          </div>

          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 11 }}>결제수단</h3>
          <div className="optcards" data-radiogroup style={{ marginBottom: 26 }}>
            <div className="optcard on" data-radio>
              <span className="rd" />
              <span className="em">
                <i className="icn icn-card" />
              </span>{' '}
              신용·체크카드
            </div>
            <div className="optcard" data-radio>
              <span className="rd" />
              <span className="em">
                <i className="icn icn-message" />
              </span>{' '}
              카카오페이 <span className="tag">간편</span>
            </div>
            <div className="optcard" data-radio>
              <span className="rd" />
              <span className="em">
                <i className="icn icn-bank" />
              </span>{' '}
              계좌이체
            </div>
            <div className="optcard" data-radio>
              <span className="rd" />
              <span className="em">
                <i className="icn icn-receipt" />
              </span>{' '}
              가상계좌
            </div>
          </div>

          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 11 }}>
            현금영수증 / 세금계산서
          </h3>
          <div
            className="optcards"
            data-radiogroup
            style={{ gridTemplateColumns: 'repeat(3,1fr)', marginBottom: 12 }}
          >
            <div className="optcard on" data-radio>
              <span className="rd" /> 현금영수증
            </div>
            <div className="optcard" data-radio>
              <span className="rd" /> 세금계산서
            </div>
            <div className="optcard" data-radio>
              <span className="rd" /> 발급안함
            </div>
          </div>
          <input className="input" placeholder="휴대폰번호 (소득공제용)" />
        </div>

        {/* 우 요약 */}
        <div className="card gborder" style={{ padding: 22, position: 'sticky', top: 84 }}>
          <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 14 }}>{sumhead}</h3>
          <div className="sumrow">
            <span className="k">{row1k}</span>
            <span>{row1v}</span>
          </div>
          {couponApplied && (
            <div className="sumrow save" style={{ display: 'flex' }}>
              <span className="k">{disck}</span>
              <span className="v">{discv}</span>
            </div>
          )}
          <div className="sumrow">
            <span className="k">{row2k}</span>
            <span>{row2v}</span>
          </div>
          <div className="sumrow total">
            <span>{totalk}</span>
            <span className="v">{couponApplied ? disc : base}</span>
          </div>
          <Link className="btn btn-grad btn-block" to={completeTo} style={{ marginTop: 16 }}>
            {C.cta} <span className="arr">→</span>
          </Link>
          <div className="trust">
            {C.trust.map((t, i) => (
              <span key={i} dangerouslySetInnerHTML={{ __html: t }} />
            ))}
          </div>
          <div
            className="muted"
            style={{
              fontSize: 11,
              marginTop: 14,
              lineHeight: 1.75,
              background: 'var(--color-surface-alt)',
              padding: '11px 12px',
              borderRadius: 'var(--radius-md)',
            }}
          >
            {C.notice}
          </div>
        </div>
      </div>
    </>
  )
}
