import { Link } from 'react-router-dom'

/** 아직 React로 옮기지 않은 화면 — 라우트는 살아 있고, 다음 단계에서 컴포넌트로 교체.
 *  Tailwind 마이그레이션 레퍼런스: 레이아웃은 유틸, 효과 박힌 컴포넌트(.btn-grad)·배지(.kicker)는 클래스 유지. */
export default function Stub({ title }: { title: string }) {
  return (
    <div className="mx-auto grid min-h-[72vh] max-w-container place-items-center px-6 py-10 text-center">
      <div>
        <span className="kicker">React 포팅 예정</span>
        <h2>{title}</h2>
        <p className="text-muted">
          이 화면은 다음 단계에서 React 컴포넌트로 옮길 예정이에요.
          <br />
          지금은 정적 시안(docs/)에서 확인할 수 있어요.
        </p>
        <Link className="btn btn-grad btn-lg mt-[18px]" to="/">
          ← 홈으로
        </Link>
      </div>
    </div>
  )
}
