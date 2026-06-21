import { Link } from 'react-router-dom'

/** 관리자 콘솔 — 사이드바 + KPI + 매출 차트/도넛 + 코스 테이블 + 처리대기/활동.
 * 정적 콘솔이라 전역 클릭위임(seg2·toast·theme)으로 동작. 페이지 전용 스타일은 인라인. */
const STYLE = `
  body{background:var(--color-surface-alt)}
  .admin{display:grid;grid-template-columns:212px 1fr;min-height:100vh}
  .side{background:#0f1117;color:#c5cdda;padding:18px 0;display:flex;flex-direction:column}
  .side .brand{padding:0 20px 18px;display:flex;align-items:center;gap:9px}
  .side .brand .mk{width:26px;height:26px;border-radius:8px;background:var(--grad-iris);display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:900;color:#fff}
  .side .brand b{color:#fff;font-size:15px;letter-spacing:-.02em}
  .side .sec{font-size:10px;text-transform:uppercase;letter-spacing:.08em;color:#5b6577;padding:14px 20px 6px;font-weight:700}
  .side a{display:flex;align-items:center;gap:10px;padding:10px 20px;font-size:13px;cursor:pointer;text-decoration:none;color:#c5cdda;border-left:3px solid transparent}
  .side a:hover{background:#171d29;color:#fff}
  .side a.on{background:#1c2230;color:#fff;border-left-color:var(--color-primary)}
  .side a .nq{margin-left:auto;font-size:10.5px;font-weight:700;background:#2a3142;color:#aeb8c9;padding:1px 7px;border-radius:10px}
  .side a.on .nq,.side a:hover .nq{background:var(--color-primary);color:#fff}
  .side .foot{margin-top:auto;padding:14px 20px 4px}
  .side .foot a{padding:8px 0;color:#8b95a8;border:none}
  .main{padding:24px 28px;max-width:1240px}
  .kpis{margin-bottom:18px}
  .grid-2{display:grid;grid-template-columns:1.7fr 1fr;gap:18px;margin-bottom:18px}
  @media(max-width:980px){.grid-2{grid-template-columns:1fr}}
  @media(max-width:760px){.admin{grid-template-columns:1fr}.side{display:none}.asearch{display:none}}
`

export default function Admin() {
  return (
    <div className="admin">
      <style dangerouslySetInnerHTML={{ __html: STYLE }} />
      <aside className="side">
        <div className="brand">
          <span className="mk">E</span>
          <b>EPIC Admin</b>
        </div>
        <div className="sec">운영</div>
        <a className="on">
          <i className="icn icn-chart" /> 대시보드
        </a>
        <a data-act="toast" data-msg="회원 관리 (프로토타입)">
          <i className="icn icn-users" /> 회원 관리 <span className="nq">1.2k</span>
        </a>
        <a data-act="toast" data-msg="코스 관리 (프로토타입)">
          <i className="icn icn-book" /> 코스 관리 <span className="nq">12</span>
        </a>
        <a data-act="toast" data-msg="강의 업로드 (프로토타입)">
          <i className="icn icn-upload" /> 강의 업로드
        </a>
        <div className="sec">학습</div>
        <a data-act="toast" data-msg="퀴즈 관리 (프로토타입)">
          <i className="icn icn-pencil" /> 퀴즈·시험
        </a>
        <a data-act="toast" data-msg="Q&A 관리 (프로토타입)">
          <i className="icn icn-message" /> Q&A 응답 <span className="nq">5</span>
        </a>
        <div className="sec">정산</div>
        <a data-act="toast" data-msg="결제·환불 (프로토타입)">
          <i className="icn icn-card" /> 결제·환불 <span className="nq">2</span>
        </a>
        <a data-act="toast" data-msg="쿠폰·공지 (프로토타입)">
          <i className="icn icn-ticket" /> 쿠폰·공지
        </a>
        <div className="foot">
          <Link to="/">← 사이트로 돌아가기</Link>
        </div>
      </aside>

      <main className="main">
        {/* 토픽바 */}
        <div className="atop">
          <div className="hl">
            <h2>대시보드</h2>
            <p>안녕하세요, 운영자님, 오늘의 학원 현황이에요.</p>
          </div>
          <div className="tools">
            <span className="live">실시간 · 2026.06.19</span>
            <input className="asearch" placeholder="회원·코스 검색" />
            <button className="theme-toggle" data-act="theme" aria-label="다크모드 전환">
              <span className="moon">
                <i className="icn icn-moon" />
              </span>
              <span className="sun">
                <i className="icn icn-sun" />
              </span>
            </button>
            <span className="aav gx-blue">운</span>
          </div>
        </div>

        {/* KPI */}
        <div className="kpis grid g4">
          <div className="kpi">
            <span className="accentbar" />
            <div className="top">
              <span className="ic">
                <i className="icn icn-coins" />
              </span>
              <span className="pill up">▲ 12.4%</span>
            </div>
            <div className="lb">이번 달 매출</div>
            <div className="val">
              ₩3.2<small>M</small>
            </div>
            <div className="spark">
              <i style={{ height: '42%' }} />
              <i style={{ height: '58%' }} />
              <i style={{ height: '50%' }} />
              <i style={{ height: '72%' }} />
              <i style={{ height: '66%' }} />
              <i style={{ height: '90%' }} />
            </div>
          </div>
          <div className="kpi green">
            <span className="accentbar" />
            <div className="top">
              <span className="ic">
                <i className="icn icn-users" />
              </span>
              <span className="pill up">▲ 8명</span>
            </div>
            <div className="lb">신규 수강생</div>
            <div className="val">
              38<small> 명</small>
            </div>
            <div className="spark">
              <i style={{ height: '30%' }} />
              <i style={{ height: '48%' }} />
              <i style={{ height: '40%' }} />
              <i style={{ height: '55%' }} />
              <i style={{ height: '78%' }} />
              <i style={{ height: '84%' }} />
            </div>
          </div>
          <div className="kpi">
            <span className="accentbar" />
            <div className="top">
              <span className="ic">
                <i className="icn icn-check-circle" />
              </span>
              <span className="pill up">▲ 3%p</span>
            </div>
            <div className="lb">평균 수료율</div>
            <div className="val">
              61<small>%</small>
            </div>
            <div className="spark">
              <i style={{ height: '50%' }} />
              <i style={{ height: '52%' }} />
              <i style={{ height: '48%' }} />
              <i style={{ height: '60%' }} />
              <i style={{ height: '58%' }} />
              <i style={{ height: '70%' }} />
            </div>
          </div>
          <div className="kpi amber">
            <span className="accentbar" />
            <div className="top">
              <span className="ic">
                <i className="icn icn-refresh" />
              </span>
              <span className="pill down">▼ 1건</span>
            </div>
            <div className="lb">환불 건수</div>
            <div className="val">
              2<small> 건</small>
            </div>
            <div className="spark">
              <i style={{ height: '80%' }} />
              <i style={{ height: '60%' }} />
              <i style={{ height: '70%' }} />
              <i style={{ height: '50%' }} />
              <i style={{ height: '40%' }} />
              <i style={{ height: '28%' }} />
            </div>
          </div>
        </div>

        {/* 차트 + 도넛 */}
        <div className="grid-2">
          <div className="card flat chartcard">
            <div className="ch-hd">
              <div className="t">매출 추이</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div className="lg">
                  <span>
                    <i style={{ background: 'var(--color-primary)' }} />월 매출
                  </span>
                  <span>
                    <i style={{ background: 'var(--color-accent)' }} />
                    이번 달
                  </span>
                </div>
                <div className="seg2">
                  <button className="on" data-act="noop">
                    6개월
                  </button>
                  <button data-act="noop">12개월</button>
                </div>
              </div>
            </div>
            <div className="chart">
              <div className="grid-l">
                <span>4M</span>
                <span>3M</span>
                <span>2M</span>
                <span>1M</span>
                <span>0</span>
              </div>
              <div className="bars">
                <div className="col">
                  <span className="vtip">₩1.8M</span>
                  <i style={{ height: '45%' }} />
                </div>
                <div className="col">
                  <span className="vtip">₩2.4M</span>
                  <i style={{ height: '60%' }} />
                </div>
                <div className="col">
                  <span className="vtip">₩2.1M</span>
                  <i style={{ height: '52%' }} />
                </div>
                <div className="col">
                  <span className="vtip">₩3.1M</span>
                  <i style={{ height: '78%' }} />
                </div>
                <div className="col">
                  <span className="vtip">₩2.8M</span>
                  <i style={{ height: '70%' }} />
                </div>
                <div className="col hi">
                  <span className="vtip">₩3.2M</span>
                  <i style={{ height: '92%' }} />
                </div>
              </div>
              <div className="xlabels">
                <span>1월</span>
                <span>2월</span>
                <span>3월</span>
                <span>4월</span>
                <span>5월</span>
                <span>6월</span>
              </div>
            </div>
          </div>

          <div className="card flat" style={{ padding: '18px 20px' }}>
            <div className="t" style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>
              코스별 매출 비중
            </div>
            <div className="donut" style={{ '--a': 56, '--b': 28 } as React.CSSProperties}>
              <b>
                ₩3.2M<small>이번 달</small>
              </b>
            </div>
            <div className="legend">
              <div className="lg-row">
                <i style={{ background: 'var(--color-primary)' }} />
                데일리 영어회화 <b>56%</b>
              </div>
              <div className="lg-row">
                <i style={{ background: 'var(--color-accent)' }} />
                중등 내신 영어 <b>28%</b>
              </div>
              <div className="lg-row">
                <i style={{ background: 'var(--blue-300)' }} />
                초등 파닉스 외 <b>16%</b>
              </div>
            </div>
          </div>
        </div>

        {/* 코스 테이블 */}
        <div className="card flat" style={{ padding: '6px 18px 4px', marginBottom: 18 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 0 6px',
            }}
          >
            <div style={{ fontWeight: 700, fontSize: 14 }}>코스별 통계</div>
            <a
              data-act="toast"
              data-msg="CSV 내보내기 (프로토타입)"
              style={{
                fontSize: 12,
                color: 'var(--color-primary)',
                fontWeight: 700,
                cursor: 'pointer',
                textDecoration: 'none',
              }}
            >
              <i className="icn icn-download" /> CSV 내보내기
            </a>
          </div>
          <table className="atable">
            <tbody>
              <tr>
                <th>코스</th>
                <th>상태</th>
                <th>수강생</th>
                <th>수료율</th>
                <th>평균점수</th>
                <th>매출</th>
              </tr>
              <tr>
                <td>
                  <span className="cn">
                    <span className="dot" style={{ background: 'var(--color-primary)' }} />
                    데일리 영어회화 30일
                  </span>
                </td>
                <td>
                  <span className="pill live">● 운영중</span>
                </td>
                <td>1,240</td>
                <td>
                  <div className="minibar">
                    <span className="bar">
                      <i style={{ width: '64%' }} />
                    </span>
                    64%
                  </div>
                </td>
                <td>82</td>
                <td>
                  <b>₩1.8M</b>
                </td>
              </tr>
              <tr>
                <td>
                  <span className="cn">
                    <span className="dot" style={{ background: 'var(--color-accent)' }} />
                    중등 내신 영어 완성
                  </span>
                </td>
                <td>
                  <span className="pill live">● 운영중</span>
                </td>
                <td>980</td>
                <td>
                  <div className="minibar">
                    <span className="bar">
                      <i className="done" style={{ width: '71%' }} />
                    </span>
                    71%
                  </div>
                </td>
                <td>88</td>
                <td>
                  <b>₩0.9M</b>
                </td>
              </tr>
              <tr>
                <td>
                  <span className="cn">
                    <span className="dot" style={{ background: 'var(--blue-300)' }} />
                    초등 파닉스·발음
                  </span>
                </td>
                <td>
                  <span className="pill flat">● 모집중</span>
                </td>
                <td>410</td>
                <td>
                  <div className="minibar">
                    <span className="bar">
                      <i style={{ width: '48%' }} />
                    </span>
                    48%
                  </div>
                </td>
                <td>76</td>
                <td>
                  <b>₩0.5M</b>
                </td>
              </tr>
              <tr>
                <td>
                  <span className="cn">
                    <span className="dot" style={{ background: 'var(--color-text-subtle)' }} />
                    초등 영어 첫걸음반
                  </span>
                </td>
                <td>
                  <span className="pill flat">● 준비중</span>
                </td>
                <td>—</td>
                <td>
                  <div className="minibar">
                    <span className="bar">
                      <i style={{ width: '0%' }} />
                    </span>
                    —
                  </div>
                </td>
                <td>—</td>
                <td>
                  <b>—</b>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 처리 대기 + 활동 */}
        <div className="grid-2">
          <div className="card flat" style={{ padding: '18px 20px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 8,
              }}
            >
              <div style={{ fontWeight: 700, fontSize: 14 }}>처리 대기</div>
              <span className="pill down">7건</span>
            </div>
            <div className="tasklist">
              <div className="tk">
                <i className="icn icn-message" /> 미답변 Q&A{' '}
                <span className="muted" style={{ fontSize: 11 }}>
                  데일리 회화 · 외 4건
                </span>
                <span className="qn">5</span>
              </div>
              <div className="tk">
                <i className="icn icn-refresh" /> 환불 요청 검토{' '}
                <span className="muted" style={{ fontSize: 11 }}>
                  7일 이내 미수강
                </span>
                <span className="qn">2</span>
              </div>
            </div>
            <a
              data-act="toast"
              data-msg="대기열 처리 (프로토타입)"
              className="btn btn-ghost btn-block"
              style={{ marginTop: 14, cursor: 'pointer' }}
            >
              대기열 처리하기 →
            </a>
          </div>

          <div className="card flat" style={{ padding: '18px 20px' }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 6 }}>최근 활동</div>
            <div className="feed">
              <div className="ev">
                <span className="ei">
                  <i className="icn icn-users" />
                </span>
                <span className="et">
                  <b>김**</b> 님이 데일리 회화 결제
                </span>
                <span className="when">2분 전</span>
              </div>
              <div className="ev">
                <span className="ei">
                  <i className="icn icn-cap" />
                </span>
                <span className="et">
                  <b>이**</b> 님이 중등 내신 영어 수료
                </span>
                <span className="when">18분 전</span>
              </div>
              <div className="ev">
                <span className="ei">
                  <i className="icn icn-star" />
                </span>
                <span className="et">초등 파닉스 새 수강평 (★5)</span>
                <span className="when">42분 전</span>
              </div>
              <div className="ev">
                <span className="ei">
                  <i className="icn icn-refresh" />
                </span>
                <span className="et">
                  <b>박**</b> 님 환불 요청
                </span>
                <span className="when">1시간 전</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
