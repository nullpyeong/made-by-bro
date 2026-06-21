/** 공용 한 줄 풋터 (홈 외 내부 페이지에서 사용) */
export default function Foot() {
  return (
    <div className="foot">
      <div className="inner">
        <span>
          <b style={{ color: 'var(--color-text)' }}>EPIC 에픽영어교습소</b>
        </span>
        <span>이용약관 · 환불정책 · 고객센터</span>
      </div>
    </div>
  )
}
