/** 공용 한 줄 풋터 (홈 외 내부 페이지에서 사용) — Tailwind 유틸 전환(레퍼런스) */
export default function Foot() {
  return (
    <div className="mt-5 border-t border-border bg-surface py-6">
      <div className="mx-auto flex max-w-container flex-wrap justify-between gap-2.5 px-6 text-[12px] text-muted">
        <span>
          <b className="text-fg">EPIC 에픽영어교습소</b>
        </span>
        <span>이용약관 · 환불정책 · 고객센터</span>
      </div>
    </div>
  )
}
