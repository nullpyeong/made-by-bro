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
