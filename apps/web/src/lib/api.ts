/* ===== 백엔드(/api) 호출 헬퍼 =====
 * 베이스 주소는 VITE_API_URL(없으면 dev 기본 localhost:3000/api).
 * BigInt PK는 서버에서 문자열로 직렬화되므로 id류는 string으로 받는다. */
const API_BASE =
  (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:3000/api'

export interface Offer {
  id: string
  course_id: string | null
  name: string
  price: number
  seat_limit: number
  seat_taken: number
  seats_left: number
  status: 'open' | 'sold_out' | 'closed'
}

/** 진행 중(open) 얼리버드 오퍼 1건. 실패하거나 없으면 null(호출부가 정적 기본값 유지). */
export async function fetchOpenOffer(): Promise<Offer | null> {
  try {
    const r = await fetch(`${API_BASE}/offers`)
    if (!r.ok) return null
    const list: Offer[] = await r.json()
    return Array.isArray(list) ? list.find((o) => o.status === 'open') ?? null : null
  } catch {
    return null
  }
}

/* ===== 인증 토큰 =====
 * 프론트 로그인 흐름이 붙으면(ADR 0011) access JWT를 이 키에 저장한다 → Authorization: Bearer.
 * 아직 인증 미연동이라 토큰이 없고, 인증이 필요한 호출은 자동으로 건너뛴다(무중단). */
const ACCESS_TOKEN_KEY = 'epic-access-token'

export function getAccessToken(): string | null {
  try {
    return localStorage.getItem(ACCESS_TOKEN_KEY)
  } catch {
    return null
  }
}

export type ActivationResult =
  | { ok: true; data: unknown }
  | { ok: false; reason: 'no-auth' | 'error' }

/** 첫 강의 수강(활성화) 기록 — ADR 0006 추천인 보상 트리거.
 * JWT 세션 유저 기준이라 바디 없음, 서버가 멱등 처리(POST /rewards/activation).
 * 토큰이 없으면(미로그인) 'no-auth'로 건너뛰고, 네트워크 실패는 'error'로 삼킨다(프로토타입 무중단). */
export async function recordActivation(): Promise<ActivationResult> {
  const token = getAccessToken()
  if (!token) return { ok: false, reason: 'no-auth' }
  try {
    const r = await fetch(`${API_BASE}/rewards/activation`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!r.ok) return { ok: false, reason: 'error' }
    return { ok: true, data: await r.json().catch(() => null) }
  } catch {
    return { ok: false, reason: 'error' }
  }
}
