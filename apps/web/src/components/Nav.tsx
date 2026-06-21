import { Link } from 'react-router-dom'

/** 로고 마크(인라인 SVG ▶) — 전 페이지 공통 */
export function LogoMark() {
  return (
    <span className="ico mark">
      <svg viewBox="0 0 24 24" fill="#fff" aria-hidden="true">
        <path d="M9 7.3v9.4l7.2-4.7z" />
      </svg>
    </span>
  )
}

type NavLink = { to: string; label: string }

/** 공용 상단 내비(.gnb) — 내부 페이지 표준 헤더.
 * 테마 토글·장바구니 배지·알림·마이페이지는 전역 핸들러/배지 로직과 연결된다. */
export default function Nav({
  links = [],
  search = false,
}: {
  links?: NavLink[]
  search?: boolean
}) {
  return (
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
        {links.length > 0 && (
          <nav>
            {links.map((l) => (
              <Link key={l.to + l.label} to={l.to}>
                {l.label}
              </Link>
            ))}
          </nav>
        )}
        {search && <input className="search" placeholder="강의 검색" />}
        <div className="right">
          <button className="theme-toggle" data-act="theme" aria-label="다크모드 전환">
            <span className="moon">
              <i className="icn icn-moon" />
            </span>
            <span className="sun">
              <i className="icn icn-sun" />
            </span>
          </button>
          <Link className="cartnav" to="/cart" data-cartnav aria-label="장바구니">
            <i className="icn icn-cart" />
            <span className="cc" data-cartcount-badge hidden>
              0
            </span>
          </Link>
          <Link className="bell" to="/mypage">
            <i className="icn icn-bell" />
            <span className="dot" />
          </Link>
          <Link to="/mypage">마이페이지</Link>
        </div>
      </div>
    </div>
  )
}
