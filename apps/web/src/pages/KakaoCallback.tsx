import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { loginWithKakao } from '../lib/api'
import { toast } from '../lib/interactions'

/** 카카오 로그인 콜백 — 카카오가 ?code=... 와 함께 이 경로로 리다이렉트한다.
 * code를 POST /auth/kakao 로 교환해 세션을 저장하고 학습 허브로 이동.
 * 실패하면 로그인 화면으로 되돌린다. (Redirect URI: /auth/kakao/callback) */
export default function KakaoCallback() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [msg, setMsg] = useState('카카오 로그인 처리 중…')
  const ran = useRef(false) // StrictMode 이중 실행 방지(코드 1회성)

  useEffect(() => {
    if (ran.current) return
    ran.current = true

    const code = params.get('code')
    const error = params.get('error')
    if (error || !code) {
      setMsg('카카오 인증이 취소되었어요')
      toast('카카오 로그인이 취소되었습니다')
      const t = setTimeout(() => navigate('/login', { replace: true }), 900)
      return () => clearTimeout(t)
    }

    let cancelled = false
    ;(async () => {
      const res = await loginWithKakao(code)
      if (cancelled) return
      if (res.ok) {
        toast(`${res.user.name}님, 환영해요`)
        navigate('/mypage', { replace: true })
      } else {
        setMsg(res.message)
        toast(res.message)
        setTimeout(() => navigate('/login', { replace: true }), 1100)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [params, navigate])

  return (
    <div
      style={{
        minHeight: '70vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 14,
        color: 'var(--color-text)',
      }}
    >
      <div
        aria-hidden="true"
        style={{
          width: 34,
          height: 34,
          borderRadius: '50%',
          border: '3px solid var(--color-border, #e5e7eb)',
          borderTopColor: 'var(--color-primary)',
          animation: 'spin 0.8s linear infinite',
        }}
      />
      <div className="muted" style={{ fontSize: 14 }}>
        {msg}
      </div>
      <style
        dangerouslySetInnerHTML={{
          __html: '@keyframes spin{to{transform:rotate(360deg)}}',
        }}
      />
    </div>
  )
}
