import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Nav from '../components/Nav'
import Foot from '../components/Foot'
import {
  fetchReferralSummary,
  issueReferralCode,
  fetchMyRewards,
  getStoredUser,
  getAccessToken,
  type ReferralSummary,
  type Reward,
} from '../lib/api'
import { toast } from '../lib/interactions'

/** 추천·보상 대시보드 (ADR 0006) — 로그인 유저 본인 기준.
 * - 내 추천코드 보기/발급/복사/공유 (POST /referrals/code, GET /referrals/me)
 * - 피추천자 단계 집계 + 목록
 * - 내 보상 목록 (GET /rewards/me)
 * 미로그인이면 로그인 유도. 백엔드 미연결 시에도 화면은 안 깨지고 안내만 표시. */

const REF_STATUS_LABEL: Record<string, string> = {
  pending: '대기',
  signed_up: '가입',
  activated: '활성화',
  converted: '전환',
}
const REWARD_TYPE_LABEL: Record<string, string> = {
  sub_extension: '구독 연장',
  discount: '할인',
  cash: '현금',
}
const REWARD_STATUS_LABEL: Record<string, string> = {
  pending: '대기',
  granted: '지급됨',
  redeemed: '사용됨',
  revoked: '취소됨',
}

function label(map: Record<string, string>, key: string) {
  return map[key] ?? key
}

export default function Referrals() {
  const loggedIn = !!getAccessToken()
  const user = getStoredUser()
  const [summary, setSummary] = useState<ReferralSummary | null>(null)
  const [rewards, setRewards] = useState<Reward[]>([])
  const [loading, setLoading] = useState(loggedIn)
  const [issuing, setIssuing] = useState(false)

  useEffect(() => {
    if (!loggedIn) return
    let cancelled = false
    ;(async () => {
      const [s, r] = await Promise.all([fetchReferralSummary(), fetchMyRewards()])
      if (cancelled) return
      setSummary(s)
      setRewards(r)
      setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [loggedIn])

  async function handleIssue() {
    if (issuing) return
    setIssuing(true)
    const code = await issueReferralCode()
    setIssuing(false)
    if (code) {
      setSummary((prev) =>
        prev
          ? { ...prev, code }
          : { code, total: 0, by_status: {}, referrals: [] },
      )
      toast('추천코드를 발급했어요')
    } else {
      toast('추천코드 발급에 실패했어요 (로그인 상태를 확인해 주세요)')
    }
  }

  const code = summary?.code ?? null
  const shareUrl = code
    ? `${window.location.origin}/signup?ref=${encodeURIComponent(code)}`
    : ''

  async function copy(text: string, label = '복사했어요') {
    try {
      await navigator.clipboard.writeText(text)
      toast(label)
    } catch {
      toast('복사에 실패했어요')
    }
  }

  async function share() {
    if (!shareUrl) return
    const nav = navigator as Navigator & {
      share?: (data: { title?: string; text?: string; url?: string }) => Promise<void>
    }
    if (typeof nav.share === 'function') {
      try {
        await nav.share({
          title: 'EPIC 에픽영어교습소',
          text: '나랑 같이 영어 인강 시작해요! 추천코드로 가입하면 혜택이 있어요.',
          url: shareUrl,
        })
        return
      } catch {
        /* 사용자가 공유 취소 → 폴백 */
      }
    }
    copy(shareUrl, '공유 링크를 복사했어요')
  }

  return (
    <>
      <Nav
        links={[
          { to: '/', label: '홈' },
          { to: '/mypage', label: '마이페이지' },
        ]}
      />

      <div className="mx-auto max-w-container px-6 py-8">
        <div style={{ marginBottom: 22 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-.02em' }}>추천 · 보상</h1>
          <p className="muted" style={{ fontSize: 13.5, marginTop: 6 }}>
            친구를 초대하고 함께 시작하면 혜택을 받아요. 친구가 첫 강의를 들으면 보상이 지급돼요.
          </p>
        </div>

        {!loggedIn ? (
          <div className="card flat" style={{ padding: 28, textAlign: 'center' }}>
            <p style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>
              로그인하고 내 추천코드를 받아보세요
            </p>
            <p className="muted" style={{ fontSize: 13, marginBottom: 16 }}>
              추천코드와 보상 내역은 로그인 후 확인할 수 있어요.
            </p>
            <Link className="btn btn-grad" to="/login">
              로그인 <span className="arr">→</span>
            </Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 18 }}>
            {/* 내 추천코드 */}
            <div className="card flat" style={{ padding: 22 }}>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>내 추천코드</div>
              <p className="muted" style={{ fontSize: 12.5, marginBottom: 14 }}>
                {user?.name ? `${user.name}님의 ` : ''}전용 코드예요. 링크로 공유하면 친구의 가입 폼에 자동으로 채워져요.
              </p>

              {code ? (
                <>
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      alignItems: 'center',
                      gap: 10,
                      marginBottom: 12,
                    }}
                  >
                    <code
                      style={{
                        fontSize: 20,
                        fontWeight: 800,
                        letterSpacing: '.04em',
                        background: 'var(--color-surface-alt, #f3f4f6)',
                        border: '1px solid var(--color-border, #e5e7eb)',
                        borderRadius: 10,
                        padding: '8px 14px',
                      }}
                    >
                      {code}
                    </code>
                    <button className="btn btn-ghost btn-sm" onClick={() => copy(code, '추천코드를 복사했어요')}>
                      코드 복사
                    </button>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    <button className="btn btn-primary btn-sm" onClick={share}>
                      <i className="icn icn-message" /> 친구에게 공유
                    </button>
                    <button className="btn btn-ghost btn-sm" onClick={() => copy(shareUrl, '공유 링크를 복사했어요')}>
                      링크 복사
                    </button>
                  </div>
                </>
              ) : (
                <button
                  className="btn btn-grad"
                  onClick={handleIssue}
                  disabled={issuing}
                  style={{ opacity: issuing ? 0.7 : 1 }}
                >
                  {issuing ? '발급 중…' : '추천코드 발급받기'}
                </button>
              )}
            </div>

            {/* 추천 현황 */}
            <div className="card flat" style={{ padding: 22 }}>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14 }}>
                추천 현황 {summary ? `· 총 ${summary.total}명` : ''}
              </div>
              {loading ? (
                <p className="muted" style={{ fontSize: 13 }}>
                  불러오는 중…
                </p>
              ) : summary && summary.total > 0 ? (
                <>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 18, marginBottom: 14 }}>
                    {Object.entries(summary.by_status).map(([k, v]) => (
                      <div key={k}>
                        <div style={{ fontSize: 22, fontWeight: 800 }}>{v}</div>
                        <div className="muted" style={{ fontSize: 12 }}>
                          {label(REF_STATUS_LABEL, k)}
                        </div>
                      </div>
                    ))}
                  </div>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 6 }}>
                    {summary.referrals.map((r) => (
                      <li
                        key={r.id}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          fontSize: 13,
                          padding: '8px 0',
                          borderBottom: '1px solid var(--color-border, #eee)',
                        }}
                      >
                        <span className="muted">{new Date(r.created_at).toLocaleDateString('ko-KR')}</span>
                        <span style={{ fontWeight: 600 }}>{label(REF_STATUS_LABEL, r.status)}</span>
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <p className="muted" style={{ fontSize: 13 }}>
                  아직 추천한 친구가 없어요. 위 코드를 공유해 보세요.
                </p>
              )}
            </div>

            {/* 내 보상 */}
            <div className="card flat" style={{ padding: 22 }}>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14 }}>내 보상</div>
              {loading ? (
                <p className="muted" style={{ fontSize: 13 }}>
                  불러오는 중…
                </p>
              ) : rewards.length > 0 ? (
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 6 }}>
                  {rewards.map((rw) => (
                    <li
                      key={rw.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: 13,
                        padding: '10px 0',
                        borderBottom: '1px solid var(--color-border, #eee)',
                      }}
                    >
                      <span style={{ fontWeight: 600 }}>
                        {label(REWARD_TYPE_LABEL, rw.type)}
                        {rw.amount != null ? ` · ${rw.amount}` : ''}
                      </span>
                      <span className="muted">{label(REWARD_STATUS_LABEL, rw.status)}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="muted" style={{ fontSize: 13 }}>
                  아직 받은 보상이 없어요. 친구가 첫 강의를 들으면 보상이 지급돼요.
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      <Foot />
    </>
  )
}
