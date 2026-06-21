import { useEffect, useState, type CSSProperties } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { addToCart, getCart, toast } from '../lib/interactions'
import { fetchPublishedCourses, type ApiCourse } from '../lib/api'

const cssVar = (obj: Record<string, string | number>) => obj as CSSProperties

type Course = {
  to: string
  img?: string // /assets/ 하위 큐레이션 이미지 파일명
  imgUrl?: string // 절대 URL 썸네일(API 코스). 있으면 img보다 우선
  gx?: string // 그라데이션 클래스(무료 파닉스)
  cat?: string
  tag?: { label: string; cls: string }
  lv: string
  title: string
  meta: string
  price: string
  priceStyle?: CSSProperties
  cartName?: string // 담기 가능한 강의명(무료는 없음)
}

const COURSES: Course[] = [
  { to: '/course', img: 'course-conversation.jpg', cat: '회화', tag: { label: '대표 강의', cls: 'accent' }, lv: '입문', title: '데일리 영어회화 30일', meta: '13강 · 첫 1강 무료', price: '₩66,000', cartName: '초·중등 데일리 영어회화 30일' },
  { to: '/course', img: 'course-grammar.jpg', cat: '문법', lv: '기초', title: '기초 영문법 완성', meta: '신규 오픈', price: '₩48,000', cartName: '기초 영문법 완성' },
  { to: '/course', img: 'course-exam.jpg', cat: '내신', lv: '중등', title: '중등 내신 영어 완성', meta: '신규 오픈', price: '₩55,000', cartName: '중등 내신 영어 완성' },
  { to: '/course', gx: 'gx-teal', tag: { label: '무료', cls: 'green' }, lv: '초등', title: '초등 영어 파닉스', meta: '무료 체험', price: '무료', priceStyle: cssVar({ color: 'var(--green-500)' }) },
  { to: '/course', img: 'course-reading.jpg', cat: '독해·어휘', lv: '중등', title: '중등 독해·어휘 부스터', meta: '신규 오픈', price: '₩52,000', cartName: '중등 독해·어휘 부스터' },
  { to: '/course', img: 'course-speaking.jpg', cat: '발음', lv: '전 레벨', title: '원어민 발음 클리닉', meta: '신규 오픈', price: '₩72,000', cartName: '원어민 발음 클리닉' },
  { to: '/course', img: 'course-starter.jpg', cat: '첫걸음', tag: { label: 'NEW', cls: 'accent' }, lv: '초등', title: '초등 영어 첫걸음반', meta: '신규 오픈', price: '₩42,000', cartName: '초등 영어 첫걸음반' },
  { to: '/course', img: 'course-writing.jpg', cat: '영작', lv: '중등', title: '중등 서술형 영작 기초', meta: '신규 오픈', price: '₩50,000', cartName: '중등 서술형 영작 기초' },
]

/** API 코스(최소 필드)를 카드 모델로 매핑. 큐레이션 메타(카테고리/배지/레벨)는
 *  API에 없으므로 비워둔다 — 실데이터는 제목/썸네일/가격만으로 정직하게 렌더. */
function apiToCourse(c: ApiCourse): Course {
  return {
    to: '/course',
    imgUrl: c.thumbnail_url ?? undefined,
    gx: c.thumbnail_url ? undefined : 'gx-teal', // 썸네일 없으면 그라데이션 폴백
    lv: '',
    title: c.title,
    meta: '신규 오픈',
    price: `₩${c.price.toLocaleString('ko-KR')}`,
    cartName: c.title,
  }
}

function CourseCard({ c }: { c: Course }) {
  const navigate = useNavigate()
  const [added, setAdded] = useState(false)

  const onAdd = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (added) {
      navigate('/cart')
      return
    }
    const ok = addToCart({ name: c.cartName!, price: c.price })
    setAdded(true)
    toast(ok ? `장바구니에 담았어요 (${getCart().length})` : '이미 장바구니에 있어요')
  }

  const bgUrl = c.imgUrl ?? (c.img ? `/assets/${c.img}` : null)

  return (
    <Link className="cc" to={c.to}>
      {bgUrl ? (
        <div className="th photo" style={{ backgroundImage: `url(${bgUrl})` }}>
          {c.cat && <span className="cat">{c.cat}</span>}
          {c.tag && <span className={`tag badge ${c.tag.cls}`}>{c.tag.label}</span>}
          <span className="lv">{c.lv}</span>
        </div>
      ) : (
        <div className={`th ${c.gx}`}>
          PHONICS
          {c.tag && <span className={`tag badge ${c.tag.cls}`}>{c.tag.label}</span>}
          <span className="lv">{c.lv}</span>
        </div>
      )}
      <div className="in">
        <div className="ti">{c.title}</div>
        <div className="ins">김하영 원장</div>
        <div className="mt">
          <span className="muted" style={{ fontSize: '12.5px' }}>{c.meta}</span>
          <span className="pr" style={c.priceStyle}>{c.price}</span>
        </div>
      </div>
      {c.cartName && (
        <button
          className={`cc-add${added ? ' added' : ''}`}
          onClick={onAdd}
          aria-label={added ? '장바구니 보기' : '장바구니 담기'}
        >
          {added ? <i className="icn icn-check" /> : '+'}
        </button>
      )}
    </Link>
  )
}

export default function Home() {
  // 공개 코스를 API에서 불러와 실데이터로 렌더. 비어 있거나 실패하면 큐레이션 정적 목록 유지.
  const [apiCourses, setApiCourses] = useState<ApiCourse[] | null>(null)
  useEffect(() => {
    fetchPublishedCourses().then(setApiCourses)
  }, [])
  const courses: Course[] = apiCourses ? apiCourses.map(apiToCourse) : COURSES

  return (
    <>
      {/* ===== GNB ===== */}
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
            <a href="#courses">강의</a>
            <a href="#features">특징</a>
            <a href="#teachers">선생님</a>
            <a href="#reviews">약속</a>
            <a href="#pricing">수강안내</a>
          </nav>
          <div className="right" style={{ marginLeft: 'auto', gap: 12 }}>
            <button className="theme-toggle" data-act="theme" aria-label="다크모드 전환">
              <span className="moon"><i className="icn icn-moon" /></span>
              <span className="sun"><i className="icn icn-sun" /></span>
            </button>
            <Link className="cartnav" to="/cart" data-cartnav aria-label="장바구니">
              <i className="icn icn-cart" />
              <span className="cc" data-cartcount-badge hidden>0</span>
            </Link>
            <Link to="/login" style={{ fontWeight: 600 }}>로그인</Link>
            <Link className="btn btn-grad btn-sm" to="/player?lesson=1-1">
              무료 1강 <span className="arr">→</span>
            </Link>
            <button className="menu-btn" data-act="menu" aria-label="메뉴"><i className="icn icn-menu" /></button>
          </div>
        </div>
      </div>

      {/* ===== 모바일 드로어 ===== */}
      <div className="drawer" id="drawer">
        <div className="panel">
          <button className="x" data-act="menu-close" aria-label="닫기">×</button>
          <a href="#courses">강의</a>
          <a href="#features">특징</a>
          <a href="#teachers">선생님</a>
          <a href="#reviews">약속</a>
          <a href="#pricing">수강안내</a>
          <Link to="/qna">묻고 답하기</Link>
          <Link to="/login">로그인</Link>
          <Link className="btn btn-grad" to="/player?lesson=1-1" style={{ marginTop: 14 }}>무료 1강 보기</Link>
        </div>
      </div>

      {/* ===== 히어로 ===== */}
      <section className="hero hero-learning" id="product">
        <div className="hl-copy" data-reveal="left">
          <span className="eyebrow"><span className="dot" />초·중등 영어 인강 · 에픽영어교습소 신규 오픈</span>
          <h1>
            <span className="ln">학원처럼 끝까지 끌어주고,</span>
            <br />
            <span className="ln">인강처럼 <span className="gradient-text">부담 없이</span></span>
          </h1>
          <p className="sub">
            비싼 학원도, 사놓고 안 보던 인강도 아쉬웠다면. 원장이 1:1로 끝까지 챙기는 건 <b>학원처럼</b>, 집에서 매일 부담 없이 듣는 건 <b>인강처럼</b> — 에픽이 둘의 장점만 담았어요.
          </p>
          <div className="hero-cta">
            <Link className="btn btn-grad btn-lg" to="/player?lesson=1-1">가입 없이 1강 보기 <i className="icn icn-play" /></Link>
            <a className="btn btn-glass btn-lg" href="#pricing">요금 보기 <span className="arr">→</span></a>
          </div>
          <ul className="hero-badges">
            <li><i className="icn icn-teacher" />원장 1:1 직강</li>
            <li><i className="icn icn-check-circle" />무약정·언제든 해지</li>
            <li><i className="icn icn-play" />첫 1강 무료</li>
            <li><i className="icn icn-chart" />완청 학습 리포트</li>
          </ul>
        </div>

        <div className="hl-preview" data-reveal="right">
          <span className="hl-cap">실제 학습 화면</span>
          <div className="lesson-preview">
            <div className="lp-video" style={{ backgroundImage: 'url(/assets/course-conversation.jpg)' }}>
              <span className="lp-tag">강의 미리보기</span>
              <button className="lp-play" aria-label="강의 재생"><i className="icn icn-play" /></button>
              <span className="lp-time">06:12</span>
              <div className="lp-bar"><i /></div>
            </div>
            <div className="lp-info">
              <div className="lp-course">김하영 원장 · 데일리 영어회화 30일</div>
              <div className="lp-expr">맛보기 표현 <b>“Can I ask a question?”</b></div>
            </div>
          </div>

          <div className="study-checklist showcase">
            <div className="sc-head">이렇게 배워요</div>
            <ol className="sc-steps">
              <li><span className="sc-n">1</span><div className="sc-tx"><b>짧은 강의 영상</b><span>평균 6분, 부담 없이 매일</span></div></li>
              <li><span className="sc-n">2</span><div className="sc-tx"><b>구간 퀴즈로 확인</b><span>이해했는지 그 자리에서 점검</span></div></li>
              <li><span className="sc-n">3</span><div className="sc-tx"><b>완청 리포트</b><span>부모님이 학습을 확인</span></div></li>
            </ol>
          </div>
        </div>
      </section>

      <div className="band band-soft">
        {/* ===== 신뢰 띠 ===== */}
        <div className="container section tight">
          <div className="trustband" data-reveal>
            <span className="verified"><span className="ck"><i className="icn icn-check" /></span> 에픽영어 교습소가 직접 운영·검증하는 수업</span>
            <div className="tbrow">
              <div className="tb"><span className="ic"><i className="icn icn-school" /></span><div className="tt"><b>학원 직접 운영</b><span>교실 수업 그대로</span></div></div>
              <div className="tb"><span className="ic"><i className="icn icn-teacher" /></span><div className="tt"><b>원장 직강</b><span>영상=교실 같은 원장</span></div></div>
              <div className="tb"><span className="ic"><i className="icn icn-check-circle" /></span><div className="tt"><b>완청 인증</b><span>끝까지 봐야 인정</span></div></div>
              <div className="tb"><span className="ic"><i className="icn icn-message" /></span><div className="tt"><b>1:1 원장 Q&amp;A</b><span>막히면 직접 답변</span></div></div>
            </div>
          </div>
        </div>

        {/* ===== 원장 소개 ===== */}
        <section className="container section" id="teachers" data-reveal>
          <div className="h-center">
            <span className="kicker">원장 소개</span>
            <h2>교실에서 가르치는 <span className="gradient-text">원장</span>이 직접</h2>
            <p>영상 속 선생님이 에픽영어 교실에서 실제로 아이들을 가르치는 원장이에요. 온라인도 같은 선생님, 같은 수업.</p>
          </div>
          <div className="founder">
            <div className="fphoto">
              <img className="fimg" src="/assets/founder.jpg" alt="김하영 원장" onError={(e) => e.currentTarget.remove()} />
              <div className="fmono">하</div>
              <div className="fname">김하영</div>
              <span className="frole">에픽영어교습소 원장</span>
            </div>
            <div className="fbody">
              <h3>“학원에서 하던 그 수업을, <span className="gradient-text">하나도 빼지 않고</span> 영상에 담았어요.”</h3>
              <p>에픽영어교습소를 운영하며 교실에서 직접 아이들을 가르쳐 왔어요. 멀어서, 시간이 안 맞아서 교실에 오지 못하는 아이들에게도 같은 수업을 전하고 싶어 온라인을 시작했습니다. 온라인이라고 다른 강사에게 맡기지 않습니다 — 강의도, 질문 답변도 제가 직접 합니다. 그래서 교실 수업과 똑같은 흐름, 똑같은 눈높이로 끝까지 끌고 갈 수 있어요.</p>
              <ul className="fstats" aria-label="원장 신뢰 지표(입력 예정)">
                <li><b>00<em>년+</em></b><span>교실 강의 경력</span></li>
                <li><b>00<em>명+</em></b><span>누적 지도 학생</span></li>
                <li><b>00<em>%</em></b><span>정규반 완강률</span></li>
              </ul>
              <ul className="fpoints">
                <li><i className="icn icn-check" />모든 강의를 원장이 직접 촬영·진행</li>
                <li><i className="icn icn-check" />1:1 질문도 원장이 직접 답변</li>
                <li><i className="icn icn-check" />교실 수업과 동일한 커리큘럼·진도</li>
              </ul>
              <div className="fsubj"><span>초·중등 회화</span><span>스피킹</span><span>기초 문법</span><span>내신 대비</span></div>
            </div>
          </div>
        </section>
      </div>

      {/* ===== 벤토 ===== */}
      <section className="container section" id="features" data-reveal>
        <div className="h-center">
          <span className="kicker">왜 끝까지 볼까요</span>
          <h2>그냥 틀어두는 인강과 <span className="gradient-text">다른 이유</span></h2>
          <p>아이가 스스로 끝까지 보도록, 다섯 가지 장치가 학습을 잡아줘요.</p>
        </div>
        <div className="bento">
          <div className="b w3 feature spot">
            <div className="ic"><i className="icn icn-target" /></div>
            <h3>퀴즈를 풀어야 다음 영상</h3>
            <p>영상 중간에 퀴즈가 나와요. 맞혀야 다음 부분이 열리니까, 틀어놓고 딴짓할 수가 없어요.</p>
            <div className="deco"><div className="spark"><i style={{ height: '30%' }} /><i style={{ height: '55%' }} /><i style={{ height: '40%' }} /><i style={{ height: '80%' }} /><i style={{ height: '60%' }} /><i style={{ height: '100%' }} /><i style={{ height: '75%' }} /></div></div>
          </div>
          <div className="b w3 spot">
            <div className="ic" style={cssVar({ background: 'var(--color-accent2-soft)', color: 'var(--color-accent2)' })}><i className="icn icn-check-circle" /></div>
            <h3>끝까지 봤는지 매일 확인</h3>
            <p>빨리감기로 넘기면 기록되지 않아요. 실제로 본 만큼만 완청으로 쌓여서, 부모님도 매일 확인할 수 있어요.</p>
            <div className="deco" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div className="ring" style={cssVar({ '--p': 100 })}><b>100%</b></div>
              <div className="muted" style={{ fontSize: '12.5px' }}>완청 인증 기준<br /><b style={cssVar({ color: 'var(--color-text)' })}>끝까지 봐야 인정돼요</b></div>
            </div>
            <span className="glow" />
          </div>
          <div className="b w2 spot">
            <div className="ic"><i className="icn icn-message" /></div>
            <h3>모르면 원장님께 질문</h3>
            <p>강의마다 질문 게시판이 있어요. 에픽영어 원장이 직접, 보통 하루 안에 답해줘요.</p>
          </div>
          <div className="b w2 spot">
            <div className="ic"><i className="icn icn-cap" /></div>
            <h3>다 들으면 수료증</h3>
            <p>한 강의를 완강하면 점수가 담긴 수료증을 받아요. 성취감이 다음 강의로 이어져요.</p>
          </div>
          <div className="b w2 spot">
            <div className="ic"><i className="icn icn-chart" /></div>
            <h3>오늘 얼마나 했는지 한눈에</h3>
            <p>며칠 연속 공부했는지, 퀴즈는 몇 점인지 한 화면에. 매일의 성장이 눈에 보여요.</p>
          </div>
        </div>
      </section>

      <div className="band band-soft">
        {/* ===== 통계 밴드 ===== */}
        <div className="container section tight" data-reveal>
          <div className="stats">
            <div className="st"><div className="num"><span data-count="6">0</span><span className="u">분</span></div><div className="lb">평균 강의 길이</div></div>
            <div className="st"><div className="num"><span data-count="4">0</span><span className="u">문항</span></div><div className="lb">강마다 구간 퀴즈</div></div>
            <div className="st"><div className="num"><span data-count="100">0</span><span className="u">%</span></div><div className="lb">완청 인증 기준</div></div>
            <div className="st"><div className="num"><span data-count="90">0</span><span className="u">일</span></div><div className="lb">단건 구매 복습 기간</div></div>
          </div>
        </div>

        {/* ===== 작동 방식 ===== */}
        <section className="container section" id="how" data-reveal>
          <div className="h-center">
            <span className="kicker">이렇게 공부해요</span>
            <h2>처음이어도 4단계면 충분해요</h2>
            <p>레벨 진단부터 수료까지, 하나의 흐름으로 설계된 학습 경로</p>
          </div>
          <div className="steps" style={{ marginTop: 26 }}>
            <div className="step"><h4>레벨 진단</h4><p>3분 진단 테스트로 현재 위치와 추천 강의를 확인합니다.</p></div>
            <div className="step"><h4>맞춤 커리큘럼</h4><p>입문·기초·중급 중 내 단계에 맞는 코스를 추천받아요.</p></div>
            <div className="step"><h4>완청 + 퀴즈</h4><p>구간 퀴즈와 완청 인증으로 매일 조금씩, 빠짐없이.</p></div>
            <div className="step"><h4>수료·다음 단계</h4><p>수료증 발급과 함께 다음 레벨을 자동 추천받습니다.</p></div>
          </div>
        </section>
      </div>

      {/* ===== 인기 강의 ===== */}
      <section className="container section" id="courses" data-reveal>
        <div className="section-h">
          <div className="lead"><span className="kicker">강의 둘러보기</span><h2>지금 인기 강의</h2></div>
          <a className="muted" href="#" onClick={(e) => e.preventDefault()} style={{ textDecoration: 'none', fontSize: 13 }}>전체보기 →</a>
        </div>
        <div className="chip-group" style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          <span className="chip on">전체</span><span className="chip">회화</span><span className="chip">문법</span><span className="chip">내신</span><span className="chip">독해·어휘</span><span className="chip">초등</span><span className="chip">중등</span>
        </div>
        <div className="grid">
          {courses.map((c, i) => <CourseCard key={i} c={c} />)}
        </div>
      </section>

      <div className="band band-soft">
        {/* ===== 후기/약속 ===== */}
        <section className="container section" id="reviews" data-reveal>
          <div className="h-center">
            <span className="kicker">원장의 약속</span>
            <h2>이제 막 온라인을 <span className="gradient-text">시작합니다</span></h2>
            <p>아직 보여드릴 후기는 쌓이는 중이에요. 대신 교실에서 지켜온 약속 그대로, 온라인에서도 지키겠습니다.</p>
          </div>
          <div className="grid g3">
            <div className="promise spot"><div className="ic"><i className="icn icn-school" /></div><h3>교실 그대로</h3><p>학원에서 하던 수업을 똑같은 원장이, 똑같은 커리큘럼으로. 온라인이라고 다른 강사에게 맡기지 않아요.</p></div>
            <div className="promise spot"><div className="ic"><i className="icn icn-check-circle" /></div><h3>끝까지 보게</h3><p>구간 퀴즈와 완청 인증으로 흘려듣기를 막아요. 빨리감기는 기록되지 않으니, 실제로 본 만큼만 쌓여요.</p></div>
            <div className="promise spot"><div className="ic"><i className="icn icn-message" /></div><h3>막히면 직접 답</h3><p>질문 게시판의 답변은 원장이 직접 답니다. 교실에서 손 들고 묻던 것처럼, 온라인에서도 바로 물어보세요.</p></div>
          </div>
          <div className="fsign">
            <div className="fsign-ph">
              <img src="/assets/founder.jpg" alt="김하영 원장" onError={(e) => e.currentTarget.remove()} />
              <span className="fsign-noimg"><i className="icn icn-camera" />원장 실사 사진<small>assets/founder.jpg</small></span>
            </div>
            <div>
              <p className="fsign-quote">“교실에서 만난 아이를 끝까지 책임지던 마음 그대로, 화면 너머의 아이도 끝까지 함께하겠습니다.”</p>
              <div className="fsign-by"><b>김하영</b> · 에픽영어교습소 원장 드림</div>
            </div>
          </div>
        </section>
      </div>

      {/* ===== 요금제 ===== */}
      <section className="container section" id="pricing" data-reveal>
        <div className="h-center">
          <span className="kicker">수강 안내</span>
          <h2>부담 없이 시작하고, <span className="gradient-text">맞으면 계속</span></h2>
          <p>먼저 무료로 충분히 들어보고 결정하세요. <b>약정도, 위약금도</b> 없어요.</p>
        </div>
        <div className="trial-strip">
          <div className="ts-l"><span className="ts-tag">무료</span><div><b>결제 전에, 무료로 충분히 먼저</b><span>무료 강의 · 1강 미리보기 · 완청 인증과 학습 리포트까지 — 카드 등록 없이 체험해요.</span></div></div>
          <Link className="btn btn-ghost btn-sm" to="/player?lesson=1-1">가입 없이 체험 <span className="arr">→</span></Link>
        </div>
        <div className="pricing two">
          <div className="plan">
            <span className="ptag badge gray">원하는 강의만</span>
            <div className="pname">강의 단건 구매</div>
            <div className="pdesc">딱 필요한 강의 하나만</div>
            <div className="price"><small style={{ fontWeight: 700 }}>₩</small>42,000<small> 부터</small></div>
            <div className="panchor">한 번 결제로 <b>90일</b> 내내 복습 — 학원 한 달 등록비도 안 돼요</div>
            <ul>
              <li>강의 1개 결제 · <b>90일</b> 무제한 복습</li>
              <li>구간 퀴즈 + 완청 인증</li>
              <li>1:1 선생님 질문 포함</li>
              <li>수료증 · PDF 학습자료</li>
            </ul>
            <a className="btn btn-ghost btn-block" href="#courses">강의 둘러보기 <span className="arr">→</span></a>
          </div>
          <div className="plan pop gborder">
            <span className="ptag badge accent">전 과목 무제한 · 가장 인기</span>
            <div className="pname">전 과목 멤버십</div>
            <div className="pdesc">같은 원장 수업, 전 과목을 매달</div>
            <div className="price"><span className="was">₩19,900</span>₩16,900<small> /월</small></div>
            <div className="panchor">하루 약 <b>560원</b> — 교실 대면 수업의 1/10 값으로 같은 원장에게</div>
            <ul>
              <li><b>모든 강의</b> 무제한 수강</li>
              <li>매월 신규 강의 자동 포함</li>
              <li>1:1 선생님 질문 무제한</li>
              <li>매일 완청 알림 · 수료증</li>
            </ul>
            <Link className="btn btn-grad btn-block" to="/checkout?plan=membership">멤버십 시작 <span className="arr">→</span></Link>
            <div className="pnote">무약정 · 언제든 해지 · 7일 100% 환불</div>
          </div>
        </div>
        <div className="assure-row">
          <span className="ai"><i className="icn icn-check" /><b>무약정</b> 언제든 해지</span>
          <span className="ai"><i className="icn icn-check" /><b>7일 100% 환불</b> 안 맞으면 그냥</span>
          <span className="ai"><i className="icn icn-check" /><b>무료 체험</b> 결제 전 먼저</span>
        </div>
        <div className="enroll-strip">
          <div className="es-l"><span className="es-ic"><i className="icn icn-school" /></span><div><b>에픽영어 학원생·형제라면?</b><span>학원 수업과 같은 커리큘럼 + 형제 추가 할인. 학원 선생님이 직접 관리해요.</span></div></div>
          <a className="btn btn-ghost btn-sm" href="#" onClick={(e) => e.preventDefault()} data-act="toast" data-msg="학원 연계반 문의가 접수되었습니다">학원 연계반 문의</a>
        </div>
      </section>

      {/* ===== FAQ ===== */}
      <div className="band band-soft">
        <section className="container section" id="faq" data-reveal>
          <div className="h-center">
            <span className="kicker">자주 묻는 질문</span>
            <h2>결제 전, <span className="gradient-text">이것부터</span> 확인하세요</h2>
            <p>학부모님들이 가장 많이 묻는 질문을 모았어요. 더 궁금하면 1:1로 물어보세요.</p>
          </div>
          <div className="faq-list">
            <div className="acc"><button className="hd">학원에 다녀야만 들을 수 있나요?<span className="chev"><i className="icn icn-chevron" /></span></button>
              <div className="bd"><div className="bdin"><div className="row faq-a">아니요. 에픽영어 학원에 다니지 않아도 누구나 수강할 수 있어요. 교실에서 검증된 같은 커리큘럼을, 지역에 상관없이 어디서나 들을 수 있습니다.</div></div></div></div>
            <div className="acc"><button className="hd">일반 인강이랑 뭐가 다른가요?<span className="chev"><i className="icn icn-chevron" /></span></button>
              <div className="bd"><div className="bdin"><div className="row faq-a">짧은 강의 → 구간 퀴즈 → 완청 인증 → 학부모 리포트로 이어지는 <b>"끝까지 보게 만드는 구조"</b>가 핵심이에요. 그냥 틀어두는 인강과 달리, 퀴즈를 풀어야 다음으로 넘어가고 부모님이 진도를 확인할 수 있습니다.</div></div></div></div>
            <div className="acc"><button className="hd">우리 아이 수준에 맞을까요?<span className="chev"><i className="icn icn-chevron" /></span></button>
              <div className="bd"><div className="bdin"><div className="row faq-a">초3~중3 눈높이로 만들었어요. 알파벳·기초 단어를 아는 정도면 따라올 수 있고, 모든 문장에 한글 해설과 자막이 제공됩니다. 먼저 무료 1강으로 직접 확인해 보세요.</div></div></div></div>
            <div className="acc"><button className="hd">아이가 끝까지 볼까요? 부모가 확인할 수 있나요?<span className="chev"><i className="icn icn-chevron" /></span></button>
              <div className="bd"><div className="bdin"><div className="row faq-a">완청 인증은 강의를 끝까지 봐야 인정돼요(중간 건너뛰기 불가). 매일 학습 알림이 가고, 주간 학부모 리포트로 학습 시간·진도·퀴즈 점수를 한눈에 확인할 수 있습니다.</div></div></div></div>
            <div className="acc"><button className="hd">1:1 질문은 누가 답해 주나요?<span className="chev"><i className="icn icn-chevron" /></span></button>
              <div className="bd"><div className="bdin"><div className="row faq-a">교실에서 가르치는 김하영 원장이 직접 답합니다. 영상 속 선생님과 질문에 답하는 선생님이 같은 사람이에요.</div></div></div></div>
            <div className="acc"><button className="hd">수강 기간과 환불은 어떻게 되나요?<span className="chev"><i className="icn icn-chevron" /></span></button>
              <div className="bd"><div className="bdin"><div className="row faq-a">단건 강의는 결제일로부터 <b>90일간</b> 무제한 반복 수강이며, 모바일·PC 어디서나 이어볼 수 있어요. 환불은 학원법 기준에 따라 진도율에 비례해 처리됩니다.</div></div></div></div>
          </div>
          <div className="faq-more">
            <span>여기에 없는 궁금증이 있으신가요?</span>
            <Link className="btn btn-ghost btn-sm" to="/qna">1:1로 물어보기 <span className="arr">→</span></Link>
          </div>
        </section>
      </div>

      {/* ===== CTA ===== */}
      <section className="container section">
        <div className="cta saas" data-reveal>
          <h2>오늘 시작하면, 30일 뒤 달라져요</h2>
          <p>무료 강의로 먼저 들어보고, 마음에 들면 그때 정규 수강을 시작하세요.</p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link className="btn btn-primary btn-lg" to="/player?lesson=1-1">가입 없이 1강 보기 <span className="arr">→</span></Link>
            <a className="btn btn-glass btn-lg" href="#pricing" style={{ color: '#fff', borderColor: 'rgba(255,255,255,.4)' }}>요금 보기</a>
          </div>
        </div>
      </section>

      {/* ===== 풋터 ===== */}
      <div className="foot big">
        <div className="inner">
          <div className="brandcol">
            <Link className="logo" to="/">
              <span className="ico mark"><svg viewBox="0 0 24 24" fill="#fff" aria-hidden="true"><path d="M9 7.3v9.4l7.2-4.7z" /></svg></span>
              <span className="wm"><b>EPIC<em>.</em></b><i>에픽영어교습소</i></span>
            </Link>
            <p className="muted">Every Person Is Curious.<br />학원에서 검증된 초·중등 영어 인강.</p>
          </div>
          <div><h5>바로가기</h5><a href="#courses">강의</a><a href="#teachers">선생님</a><a href="#pricing">수강안내</a><a href="#reviews">약속</a></div>
          <div><h5>지원</h5><Link to="/qna">Q&A</Link><a href="#" onClick={(e) => e.preventDefault()} data-act="toast" data-msg="고객센터 준비 중">고객센터</a><a href="#" onClick={(e) => e.preventDefault()} data-act="toast" data-msg="환불정책 준비 중">환불정책</a><a href="#" onClick={(e) => e.preventDefault()} data-act="toast" data-msg="FAQ 준비 중">FAQ</a></div>
          <div><h5>회사</h5><a href="#" onClick={(e) => e.preventDefault()} data-act="toast" data-msg="이용약관 준비 중">이용약관</a><a href="#" onClick={(e) => e.preventDefault()} data-act="toast" data-msg="개인정보처리방침 준비 중">개인정보처리방침</a><Link to="/admin">관리자</Link></div>
        </div>
        <div className="inner" style={{ borderTop: '1px solid var(--color-border)', marginTop: 18, paddingTop: 16, fontSize: '11.5px' }}>
          <span>© 2026 EPIC 에픽영어교습소. All rights reserved.</span>
          <span>사업자등록번호 000-00-00000 · 통신판매업 2026-서울-0000</span>
        </div>
      </div>
    </>
  )
}
