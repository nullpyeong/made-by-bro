import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  fetchCohorts,
  createCohort,
  fetchFunnel,
  grantReward,
  getAccessToken,
  getStoredUser,
  type Cohort,
  type Funnel,
} from '../lib/api'
import { toast } from '../lib/interactions'

/** 관리자 콘솔 — 실데이터 연동 뼈대(ADR 0006/0011).
 * 코호트(목록·생성)·퍼널 집계·보상 수동 지급을 백엔드(admin 가드)와 직접 연동한다.
 * 전역 JwtAuthGuard + RolesGuard('admin') — 미로그인=401, 권한없음=403을 화면에서 구분 안내.
 * 차트/회원관리 등 나머지 운영 화면은 다음 단계 후속(여기서는 핵심 동선만). */
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
  .side .foot{margin-top:auto;padding:14px 20px 4px}
  .side .foot a{padding:8px 0;color:#8b95a8;border:none}
  .main{padding:24px 28px;max-width:1100px}
  .acard{background:var(--color-surface);border:1px solid var(--color-border);border-radius:14px;padding:20px;margin-bottom:18px}
  .acard h3{font-size:15px;font-weight:800;margin:0 0 4px}
  .acard .sub{font-size:12.5px;color:var(--color-text-muted);margin:0 0 14px}
  .atable{width:100%;border-collapse:collapse;font-size:13px}
  .atable th{text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:var(--color-text-muted);padding:8px 10px;border-bottom:1px solid var(--color-border)}
  .atable td{padding:9px 10px;border-bottom:1px solid var(--color-border)}
  .arow{display:flex;flex-wrap:wrap;gap:8px;align-items:flex-end}
  .arow .field{margin:0}
  .funnel{display:flex;flex-wrap:wrap;gap:22px}
  .funnel .n{font-size:26px;font-weight:800}
  .funnel .k{font-size:12px;color:var(--color-text-muted)}
  @media(max-width:760px){.admin{grid-template-columns:1fr}.side{display:none}}
`

const FUNNEL_LABEL: Record<string, string> = {
  signup: '가입',
  login: '로그인',
  referral_signup: '추천가입',
  referral_click: '추천클릭',
  activation_first_lecture: '활성화(첫강의)',
  review_submitted: '후기작성',
}

export default function Admin() {
  const loggedIn = !!getAccessToken()
  const user = getStoredUser()
  const [cohorts, setCohorts] = useState<Cohort[]>([])
  const [funnel, setFunnel] = useState<Funnel | null>(null)
  const [funnelCohort, setFunnelCohort] = useState<string>('') // '' = 전체
  const [loading, setLoading] = useState(true)
  const [authErr, setAuthErr] = useState<string>('') // 권한/연결 안내

  // 생성 폼
  const [newName, setNewName] = useState('')
  const [newNotes, setNewNotes] = useState('')
  // 보상 지급
  const [grantId, setGrantId] = useState('')

  const reload = useCallback(async () => {
    setLoading(true)
    const [c, f] = await Promise.all([fetchCohorts(), fetchFunnel(funnelCohort || undefined)])
    if (!c.ok) {
      setAuthErr(
        c.status === 401
          ? '로그인이 필요합니다.'
          : c.status === 403
            ? '관리자 권한이 필요합니다. (현재 계정은 일반 회원)'
            : c.message,
      )
      setCohorts([])
    } else {
      setAuthErr('')
      setCohorts(c.data)
    }
    setFunnel(f.ok ? f.data : null)
    setLoading(false)
  }, [funnelCohort])

  useEffect(() => {
    if (!loggedIn) {
      setAuthErr('로그인이 필요합니다.')
      setLoading(false)
      return
    }
    reload()
  }, [loggedIn, reload])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!newName.trim()) {
      toast('코호트 이름을 입력해 주세요')
      return
    }
    const res = await createCohort({ name: newName.trim(), notes: newNotes.trim() || undefined })
    if (res.ok) {
      toast('코호트를 생성했어요')
      setNewName('')
      setNewNotes('')
      reload()
    } else {
      toast(res.message)
    }
  }

  async function handleGrant(e: React.FormEvent) {
    e.preventDefault()
    if (!grantId.trim()) {
      toast('referralId를 입력해 주세요')
      return
    }
    const res = await grantReward(grantId.trim())
    if (res.ok) {
      toast('보상을 지급했어요')
      setGrantId('')
    } else {
      toast(res.message)
    }
  }

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
          <i className="icn icn-chart" /> 그로스 대시보드
        </a>
        <a data-act="toast" data-msg="회원 관리 (후속)">
          <i className="icn icn-users" /> 회원 관리
        </a>
        <a data-act="toast" data-msg="코스 관리 (후속)">
          <i className="icn icn-book" /> 코스 관리
        </a>
        <div className="sec">정산</div>
        <a data-act="toast" data-msg="결제·환불 (후속)">
          <i className="icn icn-card" /> 결제·환불
        </a>
        <div className="foot">
          <Link to="/">← 사이트로</Link>
        </div>
      </aside>

      <main className="main">
        <div style={{ marginBottom: 18 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800 }}>그로스 대시보드</h1>
          <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginTop: 4 }}>
            ADR 0006 콜드스타트 캠페인 운영 — 코호트 · 퍼널 · 보상
            {user?.name ? ` · ${user.name}` : ''}
          </p>
        </div>

        {authErr && (
          <div
            className="acard"
            style={{
              borderColor: 'var(--color-danger, #d92d20)',
              background: 'var(--color-danger-soft, #fef3f2)',
            }}
          >
            <h3 style={{ color: 'var(--color-danger, #d92d20)' }}>접근할 수 없어요</h3>
            <p className="sub" style={{ margin: 0 }}>
              {authErr}{' '}
              {!loggedIn && (
                <Link to="/login" style={{ color: 'var(--color-primary)', fontWeight: 700 }}>
                  로그인하기
                </Link>
              )}
            </p>
          </div>
        )}

        {/* 퍼널 */}
        <div className="acard">
          <h3>퍼널 집계</h3>
          <p className="sub">M1 활성화율 · M3 CAC의 기초 지표 (events 기준)</p>
          <div className="arow" style={{ marginBottom: 14 }}>
            <div className="field">
              <label>코호트 필터</label>
              <select
                className="input"
                value={funnelCohort}
                onChange={(e) => setFunnelCohort(e.target.value)}
              >
                <option value="">전체</option>
                {cohorts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {loading ? (
            <p className="sub" style={{ margin: 0 }}>
              불러오는 중…
            </p>
          ) : funnel && funnel.total > 0 ? (
            <div className="funnel">
              {Object.entries(funnel.by_type).map(([k, v]) => (
                <div key={k}>
                  <div className="n">{v}</div>
                  <div className="k">{FUNNEL_LABEL[k] ?? k}</div>
                </div>
              ))}
            </div>
          ) : (
            <p className="sub" style={{ margin: 0 }}>
              {authErr ? '권한 확인 후 표시됩니다.' : '아직 집계된 이벤트가 없어요.'}
            </p>
          )}
        </div>

        {/* 코호트 */}
        <div className="acard">
          <h3>코호트</h3>
          <p className="sub">시딩 대상을 레벨·기수별로 나눠 순차 개방 (ADR 0006)</p>
          {cohorts.length > 0 ? (
            <table className="atable" style={{ marginBottom: 16 }}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>이름</th>
                  <th>멤버수</th>
                  <th>시작일</th>
                </tr>
              </thead>
              <tbody>
                {cohorts.map((c) => (
                  <tr key={c.id}>
                    <td>{c.id}</td>
                    <td style={{ fontWeight: 600 }}>{c.name}</td>
                    <td>{c.member_count}</td>
                    <td>
                      {c.started_at ? new Date(c.started_at).toLocaleDateString('ko-KR') : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            !loading &&
            !authErr && (
              <p className="sub">아직 코호트가 없어요. 아래에서 첫 코호트를 만들어 보세요.</p>
            )
          )}

          <form className="arow" onSubmit={handleCreate}>
            <div className="field">
              <label>새 코호트 이름</label>
              <input
                className="input"
                placeholder="초등 1기"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
            </div>
            <div className="field" style={{ flex: 1, minWidth: 160 }}>
              <label>메모 (선택)</label>
              <input
                className="input"
                placeholder="레벨/기수 메모"
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
              />
            </div>
            <button className="btn btn-primary" type="submit">
              생성
            </button>
          </form>
        </div>

        {/* 보상 지급 */}
        <div className="acard">
          <h3>보상 수동 지급</h3>
          <p className="sub">
            추천(referralId)에 대해 비현금 보상을 지급 (POST /rewards/grant). 자동 지급은 활성화 시
            트리거되며, 여기서는 운영 백필용.
          </p>
          <form className="arow" onSubmit={handleGrant}>
            <div className="field" style={{ flex: 1, minWidth: 180 }}>
              <label>referralId</label>
              <input
                className="input"
                placeholder="예: 12"
                value={grantId}
                onChange={(e) => setGrantId(e.target.value)}
              />
            </div>
            <button className="btn btn-primary" type="submit">
              지급
            </button>
          </form>
        </div>
      </main>
    </div>
  )
}
