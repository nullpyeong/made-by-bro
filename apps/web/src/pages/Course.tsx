import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchOpenOffer } from '../lib/api'
import { initCourseCurriculum } from '../lib/engine'

/** 강의 상세 — 미리보기·핵심지표·탭(커리큘럼/소개/수강평/Q&A)·구매카드.
 * 탭·아코디언·모두펼치기·담기·바로결제·토스트는 전역 클릭위임으로 동작.
 * 커리큘럼 done/현재/잠금·섹션 진척·단원평가 배지는 진도 엔진(epic-progress-v2)으로 동기화. */
const MOBILE_STYLE = `@media(max-width:840px){.container[data-tabscope]{grid-template-columns:1fr!important}.card[data-buybox]{position:static!important}.mcta{display:flex}body{padding-bottom:74px}}`

// 얼리버드 잔여석: /api/offers 실데이터. 로딩 실패 시 정적 기본값(37/100)을 유지한다.
const FALLBACK_SEATS = { left: 37, limit: 100, pct: 63 }

export default function Course() {
  const [seats, setSeats] = useState(FALLBACK_SEATS)

  useEffect(() => {
    // 진도 기반 커리큘럼 동기화 (완료/현재/잠금·섹션 진척·단원평가 배지)
    initCourseCurriculum()
  }, [])

  useEffect(() => {
    let alive = true
    fetchOpenOffer().then((o) => {
      if (!alive || !o) return // 실패·없음 → 정적 기본값 유지
      const left = typeof o.seats_left === 'number' ? o.seats_left : o.seat_limit - o.seat_taken
      const pct = o.seat_limit ? Math.min(100, Math.round((o.seat_taken / o.seat_limit) * 100)) : 0
      setSeats({ left, limit: o.seat_limit, pct })
    })
    return () => {
      alive = false
    }
  }, [])

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: MOBILE_STYLE }} />
      {/* GNB (saas pill) */}
      <div className="gnb saas">
        <div className="inner">
          <Link className="logo" to="/">
            <span className="ico mark">
              <svg viewBox="0 0 24 24" fill="#fff" aria-hidden="true">
                <path d="M9 7.3v9.4l7.2-4.7z" />
              </svg>
            </span>
            <span className="wm">
              <b>EPIC<em>.</em></b>
              <i>에픽영어교습소</i>
            </span>
          </Link>
          <nav>
            <a href="/#courses">강의</a>
            <a href="/#features">특징</a>
            <a href="/#teachers">선생님</a>
            <a href="/#reviews">후기</a>
            <a href="/#pricing">수강안내</a>
          </nav>
          <input className="search" placeholder="강의 검색" />
          <div className="right">
            <button className="theme-toggle" data-act="theme" aria-label="다크모드 전환">
              <span className="moon"><i className="icn icn-moon" /></span>
              <span className="sun"><i className="icn icn-sun" /></span>
            </button>
            <Link className="cartnav" to="/cart" data-cartnav aria-label="장바구니">
              <i className="icn icn-cart" />
              <span className="cc" data-cartcount-badge hidden>0</span>
            </Link>
            <Link className="bell" to="/mypage">
              <i className="icn icn-bell" />
              <span className="dot" />
            </Link>
            <Link to="/mypage">마이페이지</Link>
            <button className="menu-btn" data-act="menu" aria-label="메뉴"><i className="icn icn-menu" /></button>
          </div>
        </div>
      </div>
      <div className="drawer" id="drawer">
        <div className="panel">
          <button className="x" data-act="menu-close" aria-label="닫기">×</button>
          <a href="/#courses">전체강의</a>
          <a href="/#features">왜 EPIC</a>
          <Link to="/qna">수강후기</Link>
          <Link to="/mypage">마이페이지</Link>
        </div>
      </div>

      <div className="container" style={{ paddingTop: 18, fontSize: 12.5, color: 'var(--color-text-muted)' }}>
        <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>홈</Link> ›{' '}
        <a href="/#courses" style={{ textDecoration: 'none', color: 'inherit' }}>회화</a> ›{' '}
        <span style={{ color: 'var(--color-text)' }}>데일리 영어회화 30일</span>
      </div>

      <div
        className="container"
        data-tabscope
        style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 30, alignItems: 'start', paddingTop: 20 }}
      >
        {/* ===== 좌 본문 ===== */}
        <div>
          <div className="cprev photo" data-act="toast" data-msg="무료 미리보기를 재생합니다">
            <div className="thumb" style={{ backgroundImage: 'url(/assets/course-conversation.jpg)' }} />
            <div className="grid-ov" />
            <div className="label">
              <div className="k">EPISODE 01 · 무료</div>
              <div className="t">오리엔테이션 — 말이 트이는 30일</div>
            </div>
            <div className="play"><i className="icn icn-play" /></div>
            <div className="meta">
              <span><i className="icn icn-volume" /> 자막 ON</span>
              <span>06:12</span>
              <span>HD</span>
            </div>
          </div>
          <span className="badge">회화</span> <span className="badge accent">신규 오픈</span>{' '}
          <span className="badge gray">자막 제공</span>
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: '12px 0 6px', lineHeight: 1.3 }}>
            초·중등 데일리 영어회화 30일
          </h1>
          <p className="muted" style={{ fontSize: 14, maxWidth: 560 }}>
            하루 10분, 인사부터 학교·친구·가족 이야기까지. 매일 한 편씩 우리 아이가 실제로 쓰는 표현을 익히고, 구간
            퀴즈로 흘려듣지 않게 다지는 초·중등 입문 회화 코스.
          </p>

          {/* 핵심 지표 */}
          <div className="stats" style={{ marginTop: 18, borderRadius: 'var(--radius-lg)' }}>
            <div className="st"><div className="num">13<span className="u">강</span></div><div className="lb">2시간 53분</div></div>
            <div className="st"><div className="num">4<span className="u">섹션</span></div><div className="lb">단계별 구성</div></div>
            <div className="st"><div className="num">1<span className="u">강</span></div><div className="lb">무료 미리보기</div></div>
            <div className="st"><div className="num">90<span className="u">일</span></div><div className="lb">반복 수강</div></div>
          </div>

          <div className="tabs sticky" style={{ marginTop: 24 }}>
            <span className="tab on" data-tab="cur">커리큘럼</span>
            <span className="tab" data-tab="intro">소개</span>
            <span className="tab" data-tab="rev">수강평</span>
            <span className="tab" data-tab="qna">Q&amp;A</span>
          </div>

          {/* 커리큘럼 */}
          <div data-panel="cur" data-curriculum>
            <div className="curtools">
              <div className="sum">총 <b>4개 섹션</b> · <b>13강</b> · 2시간 53분 · 진도 <b data-cur-pct>0%</b></div>
              <button className="expand-all" data-act="expand-all"><span className="tx">모두 펼치기</span><span className="ic">▾</span></button>
            </div>

            <Acc
              sec={0}
              open
              no="1"
              title="워밍업 — 인사하고 나 소개하기"
              meta="32분"
              rows={[
                { id: '1-1', t: '1-1. 오리엔테이션 — 영어로 말문 트기', tags: [['free', '무료'], ['video', '영상']], time: '06:12' },
                { id: '1-2', t: '1-2. 친구에게 인사하는 말 10가지', tags: [['video', '영상'], ['quiz', '퀴즈 4']], time: '11:30' },
                { id: '1-3', t: '1-3. 나와 우리 가족 소개하기', tags: [['video', '영상'], ['quiz', '퀴즈 4']], time: '14:08' },
              ]}
            />
            <Acc
              sec={1}
              no="2"
              title="학교 생활 영어"
              meta="53분"
              rows={[
                { id: '2-1', t: '2-1. 교실에서 선생님께 질문하기', tags: [['video', '영상'], ['exam', '완청필수']], time: '12:40' },
                { id: '2-2', t: '2-2. 좋아하는 과목·취미 말하기', tags: [['video', '영상'], ['quiz', '퀴즈 4']], time: '15:22' },
                { id: '2-3', t: '2-3. 친구랑 놀자고 말하기', tags: [['video', '영상']], time: '13:05' },
                { id: '2-4', t: '2-4. 급식·점심시간 표현', tags: [['video', '영상'], ['file', '자료']], time: '11:48' },
              ]}
            />
            <Acc
              sec={2}
              no="3"
              title="내 하루 이야기하기"
              meta="41분"
              rows={[
                { id: '3-1', t: '3-1. 시간·요일·날짜 말하기', tags: [['video', '영상']], time: '12:10' },
                { id: '3-2', t: '3-2. 내 하루 일과 말하기', tags: [['video', '영상'], ['quiz', '퀴즈 4']], time: '14:30' },
                { id: '3-3', t: '3-3. 문자·전화로 약속 잡기', tags: [['video', '영상']], time: '13:55' },
              ]}
            />
            <Acc
              sec={3}
              no="4"
              title="가족 나들이·여행 영어"
              meta="48분"
              rows={[
                { id: '4-1', t: '4-1. 가족 여행 — 공항에서', tags: [['video', '영상']], time: '16:20' },
                { id: '4-2', t: '4-2. 길 묻고 답하기', tags: [['video', '영상']], time: '13:40' },
                { id: '4-3', t: '4-3. 식당에서 주문하기', tags: [['video', '영상'], ['exam', '완청필수']], time: '18:05' },
              ]}
            />
          </div>

          {/* 소개 */}
          <div data-panel="intro" style={{ display: 'none' }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, margin: '6px 0 14px' }}>이 강의에서 배우는 것</h3>
            <ul className="checks" style={{ marginBottom: 26 }}>
              <li>인사·자기소개 등 첫 만남 필수 표현</li>
              <li>교실·친구·급식 등 학교 생활 회화</li>
              <li>좋아하는 과목·취미·하루 일과 말하기</li>
              <li>가족 여행·식당에서 쓰는 실전 표현</li>
              <li>"Can I ~?" 등 부탁·질문하는 쉬운 말</li>
              <li>원어민 발음·억양 따라 말하기</li>
            </ul>

            <h3 style={{ fontSize: 16, fontWeight: 800, margin: '6px 0 12px' }}>이런 분께 추천해요</h3>
            <div className="card flat" style={{ padding: '16px 18px', fontSize: 13.5, lineHeight: 2, marginBottom: 26 }}>
              <i className="icn icn-check" /> 영어가 처음이라 부담 없이 시작하고 싶은 초·중등 학생<br />
              <i className="icn icn-check" /> 학원 회화 수업을 집에서도 복습하고 싶은 에픽영어 학원생<br />
              <i className="icn icn-check" /> 짧은 분량으로 매일 꾸준히 습관을 들이고 싶은 아이
            </div>

            <h3 style={{ fontSize: 16, fontWeight: 800, margin: '6px 0 12px' }}>담당 선생님</h3>
            <div className="tutor" style={{ marginBottom: 26 }}>
              <div className="avatar gx-blue">하</div>
              <div>
                <h4>김하영 원장</h4>
                <div className="role">현직 에픽영어 · 회화 · 스피킹</div>
                <p>교실에서 가르치는 그 선생님이 영상에서도 직접 가르칩니다. 아이 눈높이에 맞춰 "말이 트이는 순간"을 설계해요.</p>
              </div>
            </div>

            <h3 style={{ fontSize: 16, fontWeight: 800, margin: '6px 0 12px' }}>자주 묻는 질문</h3>
            <Faq q="왕초보도 따라갈 수 있나요?" a="네, 알파벳·기초 단어를 아는 정도면 충분합니다. 모든 문장에 한글 해설과 자막이 제공됩니다." />
            <Faq q="수강 기간이 어떻게 되나요?" a="결제일로부터 90일간 무제한 반복 수강 가능하며, 모바일·PC 어디서나 이어볼 수 있습니다." />
            <Faq q="환불이 가능한가요?" a="학원법 기준에 따라 진도율에 비례해 환불됩니다. (1/3 경과 전 2/3 환급 등)" />
          </div>

          {/* 수강평 */}
          <div data-panel="rev" style={{ display: 'none' }}>
            <div className="card flat" style={{ padding: '26px 22px', textAlign: 'center' }}>
              <span
                className="ic"
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: 14,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'var(--color-primary-soft)',
                  color: 'var(--color-primary)',
                  marginBottom: 12,
                }}
              >
                <i className="icn icn-message" />
              </span>
              <h3 style={{ fontSize: 17, fontWeight: 800, marginBottom: 8 }}>수강평은 이제 막 쌓이는 중이에요</h3>
              <p className="muted" style={{ fontSize: 13.5, lineHeight: 1.85, maxWidth: 440, margin: '0 auto 16px' }}>
                에픽영어교습소가 온라인을 막 시작했어요. 교실에서 지켜온 약속 그대로, 김하영 원장이 끝까지 책임지고
                가르칩니다. 먼저 무료 1강으로 직접 확인해 보세요.
              </p>
              <Link className="btn btn-grad" to="/player?lesson=1-1" style={{ padding: '10px 20px' }}>
                <i className="icn icn-play" /> 무료 1강 보기
              </Link>
            </div>
          </div>

          {/* qna */}
          <div data-panel="qna" style={{ display: 'none' }}>
            <p className="muted" style={{ fontSize: 14 }}>
              이 강의 관련 질문은{' '}
              <Link to="/qna" style={{ color: 'var(--color-primary)', fontWeight: 700 }}>Q&amp;A 게시판</Link>
              에서 확인하고 작성할 수 있습니다. 현직 강사가 직접 답변합니다.
            </p>
          </div>

          {/* 추천 강의 */}
          <div className="divider" />
          <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 14 }}>함께 들으면 좋아요</h3>
          <div className="grid g3">
            <RecoCard img="course-grammar.jpg" cat="문법" lv="기초" ti="기초 영문법 완성" pr="₩48,000" />
            <RecoCard img="course-reading.jpg" cat="독해·어휘" lv="중등" ti="중등 독해·어휘 부스터" pr="₩52,000" />
            <RecoCard img="course-exam.jpg" cat="내신" lv="중등" ti="중등 내신 영어 완성" pr="₩55,000" />
          </div>
        </div>

        {/* ===== 우 구매 카드 ===== */}
        <div className="card gborder" data-buybox style={{ padding: 22, position: 'sticky', top: 80 }}>
          <div className="live"><span className="dot" />온라인 신규 오픈 · 첫 1강 무료 미리보기</div>

          <div className="seats">
            <div className="seats-top">
              <span className="lbl">얼리버드 평생가 · 선착순 {seats.limit}명</span>
              <span className="left"><b>{seats.left}</b>자리 남음</span>
            </div>
            <div className="seats-bar"><i style={{ width: `${seats.pct}%` }} /></div>
          </div>

          <div className="price-row">
            <span style={{ fontSize: 28, fontWeight: 900, color: 'var(--color-primary)' }}>₩56,100</span>
            <span className="muted" style={{ textDecoration: 'line-through', fontSize: 14 }}>₩66,000</span>
          </div>
          <div className="muted" style={{ fontSize: 12, marginBottom: 12 }}>
            얼리버드 100명 한정가 · 단건 구매 · 수강기간 90일 · 평생 복습 자료 제공
          </div>

          <div className="upsell">
            <span><i className="icn icn-bulb" /></span>
            <span>여러 과목 들을 거면 <b>전 과목 멤버십 ₩16,900/월</b>이 더 이득</span>
            <a href="/#pricing">멤버십 보기 →</a>
          </div>

          <button
            className="btn btn-grad btn-block"
            data-act="add-cart"
            data-name="초·중등 데일리 영어회화 30일"
            data-price="₩56,100"
            style={{ marginBottom: 8 }}
          >
            <i className="icn icn-cart" /> 장바구니에 담기 <span className="arr">→</span>
          </button>
          <button
            className="btn btn-ghost btn-block"
            data-act="buy-now"
            data-name="초·중등 데일리 영어회화 30일"
            data-price="₩56,100"
          >
            바로 결제하기
          </button>
          <Link
            className="btn btn-block"
            to="/player?lesson=1-1"
            style={{ marginTop: 8, background: 'var(--color-surface-alt)', color: 'var(--color-text)' }}
          >
            ▶ 무료 미리보기
          </Link>

          <div
            style={{
              borderTop: '1px solid var(--color-border)',
              marginTop: 16,
              paddingTop: 14,
              fontSize: 12.5,
              color: 'var(--color-text-muted)',
              lineHeight: 2.05,
            }}
          >
            <i className="icn icn-book" /> 총 13강 · 2시간 53분<br />
            <i className="icn icn-phone" /> 모바일·PC 무제한 수강<br />
            <i className="icn icn-target" /> 구간 퀴즈 + 완청 인증<br />
            <i className="icn icn-message" /> 1:1 강사 Q&amp;A<br />
            <i className="icn icn-cap" /> 수료증 발급 · PDF 자료
          </div>

          <div className="trust">
            <div className="ti"><span className="ic"><i className="icn icn-shield" /></span><span className="tx">7일 환불<br />보장</span></div>
            <div className="ti"><span className="ic"><i className="icn icn-lock" /></span><span className="tx">안전<br />결제</span></div>
            <div className="ti"><span className="ic"><i className="icn icn-infinity" /></span><span className="tx">평생<br />복습</span></div>
          </div>

          <div className="sharerow">
            <button className="sb" data-act="toast" data-msg="링크를 복사했습니다"><i className="icn icn-link" /> 링크 복사</button>
            <button className="sb" data-act="toast" data-msg="위시리스트에 담았습니다"><i className="icn icn-heart" /> 찜하기</button>
          </div>
        </div>
      </div>

      {/* 모바일 하단 고정 CTA */}
      <div className="mcta">
        <div>
          <div className="pr" data-mprice>₩56,100</div>
          <div className="muted" style={{ fontSize: 11, textDecoration: 'line-through' }}>₩66,000</div>
        </div>
        <button
          className="btn btn-grad"
          data-act="add-cart"
          data-swap="0"
          data-name="초·중등 데일리 영어회화 30일"
          data-price="₩56,100"
        >
          <i className="icn icn-cart" /> 담기
        </button>
      </div>

      <div className="foot">
        <div className="inner">
          <span><b style={{ color: 'var(--color-text)' }}>EPIC 에픽영어교습소</b></span>
          <span>이용약관 · 환불정책 · 고객센터</span>
        </div>
      </div>
    </>
  )
}

type Row = { id: string; t: string; tags: [string, string][]; time: string }
function Acc({
  sec,
  no,
  title,
  meta,
  rows,
  open,
}: {
  sec: number
  no: string
  title: string
  meta: string
  rows: Row[]
  open?: boolean
}) {
  return (
    <div className={'acc' + (open ? ' open' : '')} data-sec={sec}>
      <button className="hd">
        <span className="secno">{no}</span>
        <span className="htext">
          <span className="tt">{title}</span>
          <span className="secprog">
            <span className="bar"><i data-secbar style={{ width: '0%' }} /></span>
            <span className="pct" data-secpct>시작 전</span>
          </span>
          <span className="unitbadge" data-secbadge hidden />
        </span>
        <span className="meta">{meta}</span> <span className="chev">▾</span>
      </button>
      <div className="bd">
        <div className="bdin">
          {rows.map((r) => (
            <Link key={r.id} className="row" data-clesson={r.id} to={`/player?lesson=${r.id}`}>
              <span className="ck" /> {r.t}{' '}
              {r.tags.map(([cls, label]) => (
                <span key={cls} className={`lt ${cls}`}>{label}</span>
              ))}
              <span className="t">{r.time}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

function Faq({ q, a }: { q: string; a: string }) {
  return (
    <div className="acc">
      <button className="hd">
        {q} <span className="chev">▾</span>
      </button>
      <div className="bd">
        <div className="bdin">
          <div className="row" style={{ borderTop: 'none', color: 'var(--color-text-muted)' }}>{a}</div>
        </div>
      </div>
    </div>
  )
}

function RecoCard({ img, cat, lv, ti, pr }: { img: string; cat: string; lv: string; ti: string; pr: string }) {
  return (
    <Link className="cc" to="/course">
      <div className="th photo" style={{ backgroundImage: `url(/assets/${img})` }}>
        <span className="cat">{cat}</span>
        <span className="lv">{lv}</span>
      </div>
      <div className="in">
        <div className="ti">{ti}</div>
        <div className="mt">
          <span className="star">원장 직강</span>
          <span className="pr">{pr}</span>
        </div>
      </div>
    </Link>
  )
}
