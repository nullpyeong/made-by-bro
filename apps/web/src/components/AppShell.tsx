import { useEffect } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  initTheme,
  mountGlobalHandlers,
  armPageEffects,
  updateCartBadges,
} from '../lib/interactions'

/** 전역 셸: 테마/클릭위임은 1회, 페이지 효과(리빌·카운트·스포트라이트·내비섀도)는 라우트마다 재무장 */
export default function AppShell() {
  const navigate = useNavigate()
  const location = useLocation()

  // 전역 핸들러(클릭 위임) — 앱 1회 마운트
  useEffect(() => {
    initTheme()
    const cleanup = mountGlobalHandlers((to) => navigate(to))
    return cleanup
    // navigate는 안정적이므로 1회만
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 페이지 효과 — 라우트 변경마다 DOM 재스캔
  useEffect(() => {
    // 라우트 전환 시 최상단으로(앵커 이동 제외)
    if (!location.hash) window.scrollTo(0, 0)
    const cleanup = armPageEffects()
    updateCartBadges(false)
    return cleanup
  }, [location.pathname])

  return <Outlet />
}
