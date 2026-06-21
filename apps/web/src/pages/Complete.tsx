import { useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import Nav from '../components/Nav'
import Foot from '../components/Foot'
import { clearCart } from '../lib/interactions'

/** 결제 완료(수강 시작 ③) — 단건/멤버십 플랜 인식.
 * 진입 시 장바구니를 비우고(배지 리셋), 주문번호는 날짜 기반으로 결정적으로 생성. */
const PLAN = {
  single: {
    thumbCls: 'gx-blue',
    thumbLabel: '회화',
    name: '초·중등 데일리 영어회화 30일',
    sub: '김하영 원장 · 수강기간 90일',
    row1k: '상품 금액',
    row1v: '₩66,000',
    totalk: '결제 완료',
    startTo: '/player?lesson=1-1',
  },
  membership: {
    thumbCls: 'gx-indigo',
    thumbLabel: '전 과목',
    name: '전 과목 멤버십',
    sub: '전 강의 무제한 · 매월 신규 강의 자동 포함',
    row1k: '멤버십 (첫 달)',
    row1v: '₩16,900',
    totalk: '오늘 결제 완료',
    startTo: '/#courses',
  },
}

function orderNumber() {
  const d = new Date()
  const ymd =
    '' +
    d.getFullYear() +
    String(d.getMonth() + 1).padStart(2, '0') +
    String(d.getDate()).padStart(2, '0')
  const seq = String(((d.getHours() * 60 + d.getMinutes()) % 9000) + 1000)
  return `EPIC-${ymd}-${seq}`
}

export default function Complete() {
  const [params] = useSearchParams()
  const plan = params.get('plan') === 'membership' ? 'membership' : 'single'
  const C = PLAN[plan]
  const backTo = '/cart' + (plan === 'membership' ? '?plan=membership' : '')

  // 결제 완료 → 장바구니 비움(내비 배지 리셋)
  useEffect(() => {
    clearCart()
  }, [])

  return (
    <>
      <Nav links={[{ to: '/', label: '전체강의' }, { to: '/qna', label: 'Q&A' }]} />

      <div className="container" style={{ paddingTop: 32 }}>
        {/* 스텝 인디케이터 (3단계 완료) */}
        <div className="stepper">
          <Link className="s done" to={backTo}>
            <span className="n">
              <i className="icn icn-check" />
            </span>
            <span className="tx">장바구니</span>
          </Link>
          <span className="ln fill" />
          <span className="s done">
            <span className="n">
              <i className="icn icn-check" />
            </span>
            <span className="tx">주문/결제</span>
          </span>
          <span className="ln fill" />
          <span className="s on">
            <span className="n">3</span>
            <span className="tx">수강 시작</span>
          </span>
        </div>
      </div>

      <div className="container" style={{ maxWidth: 660, paddingBottom: 56 }}>
        {/* 성공 히어로 */}
        <div className="success">
          <div className="check">
            <svg viewBox="0 0 52 52" aria-hidden="true">
              <circle cx="26" cy="26" r="24" />
              <path d="M15 27l7.5 7.5L37 19" />
            </svg>
          </div>
          <h1>결제가 완료되었어요!</h1>
          <p className="muted">
            이제 바로 수강을 시작할 수 있어요.
            <br />
            영수증과 수강 안내는 가입 이메일로 보내드렸어요.
          </p>
        </div>

        {/* 주문 요약 */}
        <div className="card gborder" style={{ padding: 22, marginBottom: 18 }}>
          <div className="ordhead">
            <span>주문번호</span>
            <b>{orderNumber()}</b>
          </div>
          <div className="ordprod">
            <div
              className={C.thumbCls}
              style={{
                width: 84,
                height: 55,
                borderRadius: 'var(--radius-md)',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontWeight: 800,
                fontSize: 11,
                letterSpacing: '.05em',
              }}
            >
              {C.thumbLabel}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{C.name}</div>
              <div className="muted" style={{ fontSize: 12.5, marginTop: 2 }}>
                {C.sub}
              </div>
            </div>
          </div>
          <div className="sumrow">
            <span className="k">{C.row1k}</span>
            <span>{C.row1v}</span>
          </div>
          <div className="sumrow">
            <span className="k">결제수단</span>
            <span>신용·체크카드</span>
          </div>
          <div className="sumrow total">
            <span>{C.totalk}</span>
            <span className="v">{C.row1v}</span>
          </div>
        </div>

        {/* CTA */}
        <Link className="btn btn-grad btn-block" to={C.startTo} style={{ fontSize: 15, padding: 15 }}>
          <i className="icn icn-play" /> 바로 수강 시작하기
        </Link>
        <Link className="btn btn-ghost btn-block" to="/mypage" style={{ marginTop: 10 }}>
          마이페이지에서 내 강의 보기
        </Link>

        {/* 다음 단계 안내 */}
        <div className="nextsteps">
          <h3>학습을 200% 활용하는 법</h3>
          <div className="ns">
            <span className="ni">
              <i className="icn icn-check-circle" />
            </span>
            <div>
              <b>완청 인증으로 끝까지</b>
              <span>
                영상을 끝까지 보면 완청이 인증돼요. 매일 알림으로 빠뜨린 강의를 챙겨드려요.
              </span>
            </div>
          </div>
          <div className="ns">
            <span className="ni">
              <i className="icn icn-message" />
            </span>
            <div>
              <b>모르면 1:1 질문</b>
              <span>
                강의를 듣다 막히면 강의실에서 바로 선생님께 질문할 수 있어요. 현직 선생님이 직접
                답해요.
              </span>
            </div>
          </div>
          <div className="ns">
            <span className="ni">
              <i className="icn icn-cap" />
            </span>
            <div>
              <b>다 들으면 수료증</b>
              <span>전 강의를 완강하면 디지털 수료증이 발급돼요. PDF 학습 자료도 함께 받아요.</span>
            </div>
          </div>
        </div>

        <p className="muted" style={{ textAlign: 'center', fontSize: 12.5, marginTop: 22 }}>
          결제·환불 문의는{' '}
          <Link to="/qna" style={{ color: 'var(--color-primary)', fontWeight: 700 }}>
            고객센터
          </Link>
          에서 도와드려요.
        </p>
      </div>

      <Foot />
    </>
  )
}
