import Nav from '../components/Nav'
import Foot from '../components/Foot'

/** Q&A — 답변 현황 KPI + 정렬 세그먼트 + 질문 카드.
 * 칩/세그먼트/도움돼요 토스트는 전역 클릭 위임으로 동작한다. */
export default function Qna() {
  return (
    <>
      <Nav links={[{ to: '/', label: '전체강의' }, { to: '/qna', label: 'Q&A' }]} search />

      <div className="container section">
        <div className="section-h">
          <div className="lead">
            <span className="kicker">◇ 묻고 답하기</span>
            <h2>강의 질문 (Q&amp;A)</h2>
          </div>
          <button className="btn btn-grad btn-sm" data-act="toast" data-msg="질문 작성 폼을 엽니다">
            ＋ 질문 작성
          </button>
        </div>

        {/* 답변 현황 요약 */}
        <div className="kpis" style={{ gridTemplateColumns: 'repeat(3,1fr)', marginBottom: 22 }}>
          <div className="kpi">
            <span className="accentbar" />
            <div className="top">
              <span className="ic">
                <i className="icn icn-message" />
              </span>
            </div>
            <div className="lb">누적 질문</div>
            <div className="val">1,284</div>
            <div className="sub">현직 강사 직접 답변</div>
          </div>
          <div className="kpi green">
            <span className="accentbar" />
            <div className="top">
              <span className="ic">
                <i className="icn icn-check" />
              </span>
            </div>
            <div className="lb">답변 완료율</div>
            <div className="val">
              98<small>%</small>
            </div>
            <div className="sub">
              <span className="trend">평균 4시간</span> 내 답변
            </div>
          </div>
          <div className="kpi amber">
            <span className="accentbar" />
            <div className="top">
              <span className="ic">
                <i className="icn icn-hourglass" />
              </span>
            </div>
            <div className="lb">미답변</div>
            <div className="val">12</div>
            <div className="sub">순차 답변 중</div>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10,
            flexWrap: 'wrap',
            marginBottom: 20,
          }}
        >
          <div className="chip-group" style={{ display: 'flex', gap: 8 }}>
            <span className="chip on">전체</span>
            <span className="chip">미답변</span>
            <span className="chip">내 질문</span>
          </div>
          <div className="segment">
            <button className="seg on">최신순</button>
            <button className="seg">답변순</button>
            <button className="seg">인기순</button>
          </div>
        </div>

        <div className="card flat" style={{ padding: 18, marginBottom: 12 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              gap: 10,
            }}
          >
            <div style={{ fontWeight: 700, fontSize: 14.5 }}>
              "Can I ask a question?" 와 "May I ask a question?" 차이가 뭔가요?
            </div>
            <span className="badge green">답변완료</span>
          </div>
          <div className="muted" style={{ fontSize: 12.5, margin: '4px 0 12px' }}>
            2-1. 교실에서 선생님께 질문하기 · 박지민 · 2일 전
          </div>
          <div
            style={{
              background: 'var(--color-surface-alt)',
              borderRadius: 'var(--radius-md)',
              padding: 13,
              fontSize: 13,
            }}
          >
            <b style={{ color: 'var(--color-primary)' }}>김하영 원장</b> · 둘 다 정중한 표현이에요.
            May가 조금 더 격식 있는 느낌이라 선생님께는 둘 다 좋고, 친구 사이엔 Can을 더 자주 써요.
          </div>
          <div
            style={{
              display: 'flex',
              gap: 16,
              marginTop: 11,
              fontSize: 12,
              color: 'var(--color-text-muted)',
            }}
          >
            <button
              className="badge gray"
              data-act="toast"
              data-msg="도움돼요에 반응했습니다"
              style={{ border: 'none', cursor: 'pointer' }}
            >
              <i className="icn icn-thumbsup" /> 도움돼요 24
            </button>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <i className="icn icn-eye" /> 312 조회
            </span>
          </div>
        </div>

        <div className="card flat" style={{ padding: 18, marginBottom: 12 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              gap: 10,
            }}
          >
            <div style={{ fontWeight: 700, fontSize: 14.5 }}>2강 자료(PDF) 다운로드가 안 돼요</div>
            <span className="badge accent">미답변</span>
          </div>
          <div className="muted" style={{ fontSize: 12.5, marginTop: 4 }}>
            2-2. 좋아하는 과목·취미 말하기 · 이서윤 · 5시간 전
          </div>
        </div>

        <div className="card flat" style={{ padding: 18 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              gap: 10,
            }}
          >
            <div style={{ fontWeight: 700, fontSize: 14.5 }}>중간 퀴즈 답을 틀리면 다시 못 보나요?</div>
            <span className="badge green">답변완료</span>
          </div>
          <div className="muted" style={{ fontSize: 12.5, margin: '4px 0 12px' }}>
            1-2. 친구에게 인사하는 말 10가지 · 정하준 · 1주 전
          </div>
          <div
            style={{
              background: 'var(--color-surface-alt)',
              borderRadius: 'var(--radius-md)',
              padding: 13,
              fontSize: 13,
            }}
          >
            <b style={{ color: 'var(--color-primary)' }}>김하영 원장</b> · 다시 시도할 수 있으며, 정답을
            맞히면 이어서 재생됩니다.
          </div>
        </div>
      </div>

      <Foot />
    </>
  )
}
