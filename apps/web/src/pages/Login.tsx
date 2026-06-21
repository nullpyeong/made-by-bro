import { Link } from 'react-router-dom'
import { LogoMark } from '../components/Nav'

/** 로그인 — SaaS 스플릿 레이아웃(좌 브랜드 패널 / 우 폼).
 * 프로토타입이라 실제 인증은 없고, 로그인 시 학습 허브(마이페이지)로 이동한다. */
export default function Login() {
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
          <div className="formbox">
            <div style={{ marginBottom: 22 }}>
              <h2 style={{ fontSize: 22, fontWeight: 800 }}>다시 오셨네요</h2>
              <p className="muted" style={{ fontSize: 13.5, marginTop: 5 }}>
                로그인하고 학습을 이어가세요
              </p>
            </div>
            <div className="field">
              <label>이메일</label>
              <input className="input" placeholder="you@email.com" />
            </div>
            <div className="field">
              <label>비밀번호</label>
              <input className="input" type="password" placeholder="••••••••" />
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
            <Link className="btn btn-grad btn-block" to="/mypage" style={{ marginBottom: 10 }}>
              로그인 <span className="arr">→</span>
            </Link>
            <div className="divider-or">또는</div>
            <button
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
          </div>
        </div>
      </div>
    </>
  )
}
