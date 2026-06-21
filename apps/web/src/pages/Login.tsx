import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { LogoMark } from '../components/Nav'
import { login, fetchMe } from '../lib/api'
import { toast } from '../lib/interactions'

/** 로그인 — SaaS 스플릿 레이아웃(좌 브랜드 패널 / 우 폼).
 * POST /auth/login → access/refresh JWT를 localStorage(epic-access-token)에 저장하고
 * GET /auth/me로 토큰을 검증한 뒤 학습 허브(마이페이지)로 이동한다.
 * 백엔드 미연결(네트워크 실패) 시엔 프로토타입 데모 입장으로 폴백한다(토큰 없이 진입). */
export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (loading) return
    setErr('')
    if (!email.trim() || !password) {
      setErr('이메일과 비밀번호를 입력해 주세요')
      return
    }
    setLoading(true)
    const res = await login(email.trim(), password)
    if (res.ok) {
      // 발급된 access 토큰을 /auth/me로 검증(실패해도 로그인은 성공이므로 진입은 진행)
      await fetchMe()
      toast(`${res.user.name}님, 환영해요`)
      navigate('/mypage')
      return
    }
    if (res.reason === 'network') {
      // 백엔드 미연결 — 프로토타입 데모 입장(토큰 없음 → activation은 no-auth로 건너뜀)
      toast('데모 모드로 입장합니다 (백엔드 미연결)')
      navigate('/mypage')
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
              오늘도 한 걸음,
              <br />
              영어가 트이는 30일.
            </h2>
            <p>매일 10분, 구간 퀴즈와 완청 인증으로 끝까지 완주하는 초·중등 영어 인강.</p>
            <div className="pts">
              <div className="pt">
                <span className="ck">
                  <i className="icn icn-check" />
                </span>{' '}
                13강 · 모바일·PC 무제한 수강
              </div>
              <div className="pt">
                <span className="ck">
                  <i className="icn icn-check" />
                </span>{' '}
                1:1 강사 Q&amp;A + 수료증 발급
              </div>
              <div className="pt">
                <span className="ck">
                  <i className="icn icn-check" />
                </span>{' '}
                7일 이내 미수강 시 100% 환불
              </div>
            </div>
          </div>
          <div className="qt">
            "부담 없는 분량이라 처음으로 끝까지 완주했어요."
            <br />
            <span style={{ opacity: 0.8 }}>— 홍**, 데일리 영어회화 수강생</span>
          </div>
        </div>

        {/* 우: 폼 */}
        <div className="formside">
          <form className="formbox" onSubmit={handleSubmit}>
            <div style={{ marginBottom: 22 }}>
              <h2 style={{ fontSize: 22, fontWeight: 800 }}>다시 오셨네요</h2>
              <p className="muted" style={{ fontSize: 13.5, marginTop: 5 }}>
                로그인하고 학습을 이어가세요
              </p>
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
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: 12.5,
                marginBottom: 18,
              }}
            >
              <label
                className="muted"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}
              >
                <input type="checkbox" /> 로그인 유지
              </label>
              <a
                className="muted"
                href="#"
                onClick={(e) => e.preventDefault()}
                data-act="toast"
                data-msg="비밀번호 재설정 메일을 보냈습니다"
                style={{ textDecoration: 'none' }}
              >
                비밀번호 찾기
              </a>
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
                  marginBottom: 12,
                }}
              >
                {err}
              </div>
            )}
            <button
              type="submit"
              className="btn btn-grad btn-block"
              style={{ marginBottom: 10, opacity: loading ? 0.7 : 1 }}
              disabled={loading}
            >
              {loading ? '로그인 중…' : <>로그인 <span className="arr">→</span></>}
            </button>
            <div className="divider-or">또는</div>
            <button
              type="button"
              style={{
                width: '100%',
                background: '#fee500',
                color: '#3c1e1e',
                border: 'none',
                textAlign: 'center',
                padding: 13,
                borderRadius: 'var(--radius-pill)',
                fontWeight: 700,
                fontSize: 13.5,
                cursor: 'pointer',
                fontFamily: 'inherit',
                transition: 'transform .15s ease',
              }}
              data-act="toast"
              data-msg="카카오 로그인 연동 (프로토타입)"
            >
              <i className="icn icn-message" /> 카카오로 3초 만에 시작
            </button>
            <div className="center muted" style={{ fontSize: 12.5, marginTop: 20 }}>
              아직 회원이 아니신가요?{' '}
              <a
                href="#"
                onClick={(e) => e.preventDefault()}
                data-act="toast"
                data-msg="회원가입 화면으로 (프로토타입)"
                style={{ color: 'var(--color-primary)', fontWeight: 700, textDecoration: 'none' }}
              >
                이메일로 회원가입
              </a>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
