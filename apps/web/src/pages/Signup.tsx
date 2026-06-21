import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { LogoMark } from '../components/Nav'
import { signup } from '../lib/api'
import { toast } from '../lib/interactions'

/** 회원가입 — Login과 동일한 SaaS 스플릿 레이아웃(좌 브랜드 / 우 폼).
 * POST /auth/signup → 성공 시 자동 로그인(토큰 저장) 후 학습 허브로 이동.
 * 추천코드(referralCode)는 선택 — 잘못된 코드여도 가입은 진행되고 안내만 띄운다(ADR 0006).
 * URL ?ref=BRO-XXXX 로 들어오면 추천코드 칸을 자동 채운다(추천 링크 공유 동선). */
export default function Signup() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [referralCode, setReferralCode] = useState(params.get('ref') ?? '')
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (loading) return
    setErr('')
    if (!name.trim() || !email.trim() || !password) {
      setErr('이름·이메일·비밀번호를 모두 입력해 주세요')
      return
    }
    if (password.length < 8) {
      setErr('비밀번호는 8자 이상이어야 합니다')
      return
    }
    setLoading(true)
    const res = await signup({
      name: name.trim(),
      email: email.trim(),
      password,
      referralCode: referralCode.trim() || undefined,
    })
    if (res.ok) {
      toast(`${res.user.name}님, 가입을 환영해요`)
      if (res.referralWarning) {
        // 가입은 됐지만 추천코드 귀속만 실패 — 사용자에게 한 번 더 알림
        setTimeout(() => toast(`추천코드 안내: ${res.referralWarning}`), 600)
      }
      navigate('/mypage')
      return
    }
    if (res.reason === 'network') {
      setErr('서버에 연결할 수 없어요. 잠시 후 다시 시도해 주세요')
      setLoading(false)
      return
    }
    setErr(res.message)
    setLoading(false)
  }

  return (
    <>
      <div className="gnb">
        <div className="inner">
          <Link className="logo" to="/">
            <LogoMark />
            <span className="wm">
              <b>
                EPIC<em>.</em>
              </b>
              <i>에픽영어교습소</i>
            </span>
          </Link>
          <div className="right">
            <Link to="/">홈으로</Link>
          </div>
        </div>
      </div>

      <div className="auth">
        {/* 좌: 브랜드 패널 */}
        <div className="brandside">
          <div className="bz">
            <div style={{ fontWeight: 900, fontSize: 22, letterSpacing: '-.02em' }}>
              EPIC<span style={{ opacity: 0.7 }}>.</span>
            </div>
            <div style={{ fontSize: 11, letterSpacing: '.18em', opacity: 0.8, marginTop: 2 }}>
              EVERY PERSON IS CURIOUS
            </div>
          </div>
          <div className="bz">
            <h2>
              지금 시작하면,
              <br />
              첫 강의는 무료로.
            </h2>
            <p>가입하고 맛보기 강의를 먼저 확인해 보세요. 부담 없는 30일 완주 설계.</p>
            <div className="pts">
              <div className="pt">
                <span className="ck">
                  <i className="icn icn-check" />
                </span>{' '}
                가입 즉시 맛보기 강의 열람
              </div>
              <div className="pt">
                <span className="ck">
                  <i className="icn icn-check" />
                </span>{' '}
                친구 추천코드로 함께 시작하면 혜택
              </div>
              <div className="pt">
                <span className="ck">
                  <i className="icn icn-check" />
                </span>{' '}
                모바일·PC 어디서나 이어보기
              </div>
            </div>
          </div>
          <div className="qt">
            "맛보기를 보고 결정해서 후회가 없었어요."
            <br />
            <span style={{ opacity: 0.8 }}>— 김**, 데일리 영어회화 수강생</span>
          </div>
        </div>

        {/* 우: 폼 */}
        <div className="formside">
          <form className="formbox" onSubmit={handleSubmit}>
            <div style={{ marginBottom: 22 }}>
              <h2 style={{ fontSize: 22, fontWeight: 800 }}>회원가입</h2>
              <p className="muted" style={{ fontSize: 13.5, marginTop: 5 }}>
                30초면 끝나요. 가입 후 바로 학습을 시작하세요
              </p>
            </div>
            <div className="field">
              <label>이름</label>
              <input
                className="input"
                type="text"
                autoComplete="name"
                placeholder="홍길동"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="field">
              <label>이메일</label>
              <input
                className="input"
                type="email"
                autoComplete="email"
                placeholder="you@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="field">
              <label>비밀번호</label>
              <input
                className="input"
                type="password"
                autoComplete="new-password"
                placeholder="8자 이상"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="field">
              <label>
                추천코드 <span className="muted" style={{ fontWeight: 400 }}>(선택)</span>
              </label>
              <input
                className="input"
                type="text"
                placeholder="BRO-XXXXXX"
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value)}
              />
            </div>
            {err && (
              <div
                role="alert"
                style={{
                  fontSize: 12.5,
                  color: 'var(--color-danger, #d92d20)',
                  background: 'var(--color-danger-soft, #fef3f2)',
                  border: '1px solid var(--color-danger, #d92d20)',
                  borderRadius: 10,
                  padding: '9px 12px',
                  margin: '4px 0 12px',
                }}
              >
                {err}
              </div>
            )}
            <button
              type="submit"
              className="btn btn-grad btn-block"
              style={{ marginBottom: 10, marginTop: 4, opacity: loading ? 0.7 : 1 }}
              disabled={loading}
            >
              {loading ? (
                '가입 중…'
              ) : (
                <>
                  가입하고 시작하기 <span className="arr">→</span>
                </>
              )}
            </button>
            <div className="center muted" style={{ fontSize: 12.5, marginTop: 20 }}>
              이미 회원이신가요?{' '}
              <Link
                to="/login"
                style={{ color: 'var(--color-primary)', fontWeight: 700, textDecoration: 'none' }}
              >
                로그인
              </Link>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
