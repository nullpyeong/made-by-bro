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

export interface ApiCourse {
  id: string
  title: string
  description: string | null
  thumbnail_url: string | null
  price: number
  status: string
}

/** 공개(published) 코스 목록. 실패하거나 비어 있으면 null(호출부가 정적 카탈로그 유지). */
export async function fetchPublishedCourses(): Promise<ApiCourse[] | null> {
  try {
    const r = await fetch(`${API_BASE}/courses`)
    if (!r.ok) return null
    const list: ApiCourse[] = await r.json()
    return Array.isArray(list) && list.length > 0 ? list : null
  } catch {
    return null
  }
}

/* ===== 인증 세션 (ADR 0011) =====
 * 로그인 성공 시 access JWT를 epic-access-token에 저장한다 → Authorization: Bearer.
 * recordActivation 등 인증 필요한 호출은 이 토큰을 읽고, 없으면 자동으로 건너뛴다(무중단). */
const ACCESS_TOKEN_KEY = 'epic-access-token'
const REFRESH_TOKEN_KEY = 'epic-refresh-token'
const USER_KEY = 'epic-user'

export interface AuthUser {
  id: string
  email: string
  name: string
  role?: string
}

export function getAccessToken(): string | null {
  try {
    return localStorage.getItem(ACCESS_TOKEN_KEY)
  } catch {
    return null
  }
}

export function getRefreshToken(): string | null {
  try {
    return localStorage.getItem(REFRESH_TOKEN_KEY)
  } catch {
    return null
  }
}

/** 저장된 로그인 유저(login/fetchMe가 캐시). 없으면 null. */
export function getStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? (JSON.parse(raw) as AuthUser) : null
  } catch {
    return null
  }
}

function setSession(accessToken: string, refreshToken: string, user: AuthUser) {
  try {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken)
    if (refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
    localStorage.setItem(USER_KEY, JSON.stringify(user))
  } catch {
    /* localStorage 비활성 환경 무시 */
  }
}

/** 로컬 세션 토큰/유저 모두 제거(로그아웃·만료 정리). */
export function clearSession() {
  try {
    localStorage.removeItem(ACCESS_TOKEN_KEY)
    localStorage.removeItem(REFRESH_TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
  } catch {
    /* noop */
  }
}

export type LoginResult =
  | { ok: true; user: AuthUser }
  | { ok: false; reason: 'invalid' | 'network'; message: string }

/** 이메일+비밀번호 로그인(POST /auth/login) → 토큰 저장 + 유저 반환.
 * - 성공: access/refresh JWT를 localStorage에 저장(이후 activation 자동 발화)
 * - 인증 실패(401/400): reason:'invalid' + 서버 메시지 노출
 * - 네트워크 실패(백엔드 미연결): reason:'network' → 호출부가 데모 입장으로 폴백 가능 */
export async function login(email: string, password: string): Promise<LoginResult> {
  let r: Response
  try {
    r = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
  } catch {
    return { ok: false, reason: 'network', message: '서버에 연결할 수 없어요' }
  }
  if (!r.ok) {
    const msg = await r
      .json()
      .then((b) => (b?.message as string) ?? '')
      .catch(() => '')
    return {
      ok: false,
      reason: 'invalid',
      message: msg || '이메일 또는 비밀번호가 올바르지 않습니다',
    }
  }
  const data = (await r.json().catch(() => null)) as
    | { accessToken?: string; refreshToken?: string; user?: AuthUser }
    | null
  if (!data?.accessToken || !data?.user) {
    return { ok: false, reason: 'invalid', message: '로그인 응답이 올바르지 않습니다' }
  }
  setSession(data.accessToken, data.refreshToken ?? '', data.user)
  return { ok: true, user: data.user }
}

/** 현재 로그인 유저 검증(GET /auth/me, Bearer).
 * 토큰이 유효하면 유저(캐시 갱신), 401이면 세션 정리 후 null, 그 외/네트워크 실패는 null. */
export async function fetchMe(): Promise<AuthUser | null> {
  const token = getAccessToken()
  if (!token) return null
  try {
    const r = await fetch(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (r.status === 401) {
      clearSession()
      return null
    }
    if (!r.ok) return null
    const user = (await r.json().catch(() => null)) as AuthUser | null
    if (user) {
      try {
        localStorage.setItem(USER_KEY, JSON.stringify(user))
      } catch {
        /* noop */
      }
    }
    return user
  } catch {
    return null
  }
}

/** 로그아웃 — 서버 세션 폐기(best-effort) + 로컬 세션 정리. */
export async function logout(): Promise<void> {
  const refreshToken = getRefreshToken()
  if (refreshToken) {
    try {
      await fetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      })
    } catch {
      /* 폐기 실패해도 로컬은 정리 */
    }
  }
  clearSession()
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

/* ===== 인증 헤더가 붙는 공용 fetch =====
 * 저장된 access JWT가 있으면 Authorization: Bearer를 자동으로 단다. */
async function authedFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const token = getAccessToken()
  const headers = new Headers(init.headers)
  if (token) headers.set('Authorization', `Bearer ${token}`)
  return fetch(`${API_BASE}${path}`, { ...init, headers })
}

/* ===== 회원가입 (POST /auth/signup) =====
 * 성공 시 자동 로그인(토큰 발급·저장). 선택적 추천코드(referralCode)는 best-effort —
 * 코드가 잘못돼도 가입은 성공하고 referralWarning으로 알린다(ADR 0006). */
export type SignupResult =
  | { ok: true; user: AuthUser; referralWarning: string | null }
  | { ok: false; reason: 'invalid' | 'conflict' | 'network'; message: string }

export async function signup(input: {
  email: string
  password: string
  name: string
  referralCode?: string
}): Promise<SignupResult> {
  let r: Response
  try {
    r = await fetch(`${API_BASE}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })
  } catch {
    return { ok: false, reason: 'network', message: '서버에 연결할 수 없어요' }
  }
  if (!r.ok) {
    const msg = await r
      .json()
      .then((b) => (b?.message as string) ?? '')
      .catch(() => '')
    return {
      ok: false,
      reason: r.status === 409 ? 'conflict' : 'invalid',
      message: msg || '회원가입에 실패했습니다',
    }
  }
  const data = (await r.json().catch(() => null)) as
    | {
        accessToken?: string
        refreshToken?: string
        user?: AuthUser
        referralWarning?: string | null
      }
    | null
  if (!data?.accessToken || !data?.user) {
    return { ok: false, reason: 'invalid', message: '회원가입 응답이 올바르지 않습니다' }
  }
  setSession(data.accessToken, data.refreshToken ?? '', data.user)
  return { ok: true, user: data.user, referralWarning: data.referralWarning ?? null }
}

/* ===== 카카오 OAuth (GET/POST /auth/kakao) =====
 * 1) getKakaoAuthorizeUrl()로 인가 URL을 받아 프론트가 리다이렉트.
 * 2) 카카오가 ?code= 와 함께 콜백 → loginWithKakao(code)로 토큰 교환·세션 저장. */
export async function getKakaoAuthorizeUrl(state?: string): Promise<string | null> {
  try {
    const q = state ? `?state=${encodeURIComponent(state)}` : ''
    const r = await fetch(`${API_BASE}/auth/kakao${q}`)
    if (!r.ok) return null
    const data = (await r.json().catch(() => null)) as { url?: string } | null
    return data?.url ?? null
  } catch {
    return null
  }
}

export async function loginWithKakao(code: string): Promise<LoginResult> {
  let r: Response
  try {
    r = await fetch(`${API_BASE}/auth/kakao`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    })
  } catch {
    return { ok: false, reason: 'network', message: '서버에 연결할 수 없어요' }
  }
  if (!r.ok) {
    const msg = await r
      .json()
      .then((b) => (b?.message as string) ?? '')
      .catch(() => '')
    return { ok: false, reason: 'invalid', message: msg || '카카오 로그인에 실패했습니다' }
  }
  const data = (await r.json().catch(() => null)) as
    | { accessToken?: string; refreshToken?: string; user?: AuthUser }
    | null
  if (!data?.accessToken || !data?.user) {
    return { ok: false, reason: 'invalid', message: '카카오 로그인 응답이 올바르지 않습니다' }
  }
  setSession(data.accessToken, data.refreshToken ?? '', data.user)
  return { ok: true, user: data.user }
}

/* ===== 추천(referrals) — 로그인 유저 본인 기준(세션) ===== */
export interface Referral {
  id: string
  referrer_user_id: string
  referred_user_id: string | null
  code: string
  status: string
  created_at: string
}

export interface ReferralSummary {
  code: string | null
  total: number
  by_status: Record<string, number>
  referrals: Referral[]
}

/** 내 추천 요약(GET /referrals/me) — 코드·단계집계·목록. 미로그인/실패면 null. */
export async function fetchReferralSummary(): Promise<ReferralSummary | null> {
  try {
    const r = await authedFetch('/referrals/me')
    if (!r.ok) return null
    return (await r.json().catch(() => null)) as ReferralSummary | null
  } catch {
    return null
  }
}

/** 내 추천코드 발급/조회(POST /referrals/code, get-or-create). 실패면 null. */
export async function issueReferralCode(): Promise<string | null> {
  try {
    const r = await authedFetch('/referrals/code', { method: 'POST' })
    if (!r.ok) return null
    const data = (await r.json().catch(() => null)) as { code?: string } | null
    return data?.code ?? null
  } catch {
    return null
  }
}

/* ===== 보상(rewards) — 추천인 대시보드 ===== */
export interface Reward {
  id: string
  user_id: string
  referral_id: string | null
  type: string
  amount: number | null
  status: string
  created_at: string
}

/** 내 보상 목록(GET /rewards/me). 미로그인/실패면 빈 배열. */
export async function fetchMyRewards(): Promise<Reward[]> {
  try {
    const r = await authedFetch('/rewards/me')
    if (!r.ok) return []
    const list = await r.json().catch(() => null)
    return Array.isArray(list) ? (list as Reward[]) : []
  } catch {
    return []
  }
}

/* ===== 수강목록(enrollments) — 마이페이지, 로그인 유저 본인(세션) ===== */
export interface Enrollment {
  id: string
  status: 'active' | 'expired' | 'cancelled'
  purchased_at: string
  expires_at: string | null
  course: {
    id: string
    title: string
    thumbnail_url: string | null
    price: number
  }
  progress: { total: number; completed: number; pct: number }
}

/** 내 수강목록 + 진도율(GET /me/enrollments). 미로그인/실패/빈 목록이면 null(호출부가 정적 데모 유지). */
export async function fetchMyEnrollments(): Promise<Enrollment[] | null> {
  if (!getAccessToken()) return null
  try {
    const r = await authedFetch('/me/enrollments')
    if (!r.ok) return null
    const list = await r.json().catch(() => null)
    return Array.isArray(list) && list.length > 0 ? (list as Enrollment[]) : null
  } catch {
    return null
  }
}

/* ===== 관리자(admin) — 전역 JwtAuthGuard + RolesGuard('admin') (ADR 0011) =====
 * 401(미로그인)/403(권한없음)을 status로 구분해 호출부가 "관리자 권한 필요"를 표시한다. */
export interface Cohort {
  id: string
  name: string
  notes: string | null
  started_at: string | null
  created_at: string
  member_count: number
}

export interface Funnel {
  cohort_id: string | null
  total: number
  by_type: Record<string, number>
}

export type AdminResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; message: string }

async function adminRequest<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<AdminResult<T>> {
  let r: Response
  try {
    r = await authedFetch(path, {
      method,
      headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch {
    return { ok: false, status: 0, message: '서버에 연결할 수 없어요' }
  }
  if (!r.ok) {
    const msg = await r
      .json()
      .then((b) => (b?.message as string) ?? '')
      .catch(() => '')
    return { ok: false, status: r.status, message: msg || `요청 실패 (${r.status})` }
  }
  const data = (await r.json().catch(() => null)) as T
  return { ok: true, data }
}

/** 코호트 목록 + 멤버 수(GET /cohorts). */
export const fetchCohorts = () => adminRequest<Cohort[]>('GET', '/cohorts')

/** 코호트 생성(POST /cohorts). */
export const createCohort = (input: { name: string; notes?: string; startedAt?: string }) =>
  adminRequest<Cohort>('POST', '/cohorts', input)

/** 퍼널 집계(GET /events/funnel, cohortId 선택). M1 활성화율·M3 CAC 기초. */
export const fetchFunnel = (cohortId?: string) =>
  adminRequest<Funnel>(
    'GET',
    `/events/funnel${cohortId ? `?cohortId=${encodeURIComponent(cohortId)}` : ''}`,
  )

/** 보상 수동 지급(POST /rewards/grant). */
export const grantReward = (referralId: string) =>
  adminRequest<unknown>('POST', '/rewards/grant', { referralId })
