import { useEffect } from 'react'
import { initDashboard, initLiveSync } from '../lib/engine'
import { getStoredUser, fetchMyEnrollments, type Enrollment } from '../lib/api'

/* 마이페이지 — 학습 허브(resume-first 대시보드).
   정적 셸은 docs/pages/mypage.html 과 동일하게 주입하고, initDashboard()가
   진도 모델(epic-progress-v2)을 읽어 이어보기·KPI·연속학습·주간 막대차트·
   전 과정 마스터·단원평가·학부모 리포트를 실데이터로 렌더한다. initLiveSync()는
   다른 탭(player)에서 강의를 완료하면 storage 이벤트로 대시보드를 재렌더한다. */

const BODY = `
<div class="gnb"><div class="inner">
  <a class="logo" href="/"><span class="ico mark"><svg viewBox="0 0 24 24" fill="#fff" aria-hidden="true"><path d="M9 7.3v9.4l7.2-4.7z"/></svg></span><span class="wm"><b>EPIC<em>.</em></b><i>에픽영어교습소</i></span></a>
  <nav><a href="/">전체강의</a><a href="/qna">Q&A</a></nav>
  <input class="search" placeholder="강의 검색">
  <div class="right"><button class="theme-toggle" data-act="theme" aria-label="다크모드 전환"><span class="moon"><i class="icn icn-moon"></i></span><span class="sun"><i class="icn icn-sun"></i></span></button><a class="cartnav" href="/cart" data-cartnav aria-label="장바구니"><i class="icn icn-cart"></i><span class="cc" data-cartcount-badge hidden>0</span></a><a class="bell" href="/mypage"><i class="icn icn-bell"></i><span class="dot"></span></a><span style="font-weight:600;color:var(--color-text)"><span data-username>홍길동</span> 님</span><button class="btn btn-ghost btn-sm" data-act="logout" style="margin-left:6px">로그아웃</button></div>
</div></div>

<div class="container" style="padding-top:30px">
  <!-- 인사 -->
  <div style="margin-bottom:14px">
    <div style="font-size:20px;font-weight:800;letter-spacing:var(--tracking-tight);display:flex;align-items:center;gap:10px;flex-wrap:wrap">안녕하세요, <span data-username>홍길동</span> 님 <span class="streakchip"><i class="icn icn-flame"></i> 7일 연속 학습 중</span></div>
    <div class="muted" style="font-size:13px;margin-top:3px">오늘도 <b style="color:var(--color-text)">초·중등 데일리 영어회화 30일</b> 이어서 완주해볼까요?</div>
  </div>

  <!-- 이어보기 히어로 (resume-first) -->
  <div class="resume" style="margin-bottom:18px">
    <div class="rthumb" style="background-image:url(/assets/course-conversation.jpg)"><span class="rplay"><i class="icn icn-play"></i></span></div>
    <div class="rbody">
      <div class="rk">이어서 학습 · 초·중등 데일리 영어회화 30일</div>
      <div class="rt">2-1. 교실에서 선생님께 질문하기</div>
      <div class="rbar"><i data-resume-bar style="width:43%"></i></div>
      <div class="rmeta" data-resume-meta>강의 진도 43% · 3/7강 완료 · 다음 강: 2-1. 교실에서 선생님께 질문하기</div>
    </div>
    <a class="btn btn-lg" href="/player">이어보기 <span class="arr">→</span></a>
  </div>

  <!-- 학습 요약 KPI -->
  <div class="kpis" style="margin-bottom:8px">
    <div class="kpi"><span class="accentbar"></span>
      <div class="top"><span class="ic"><i class="icn icn-book"></i></span></div>
      <div class="lb">수강 중</div><div class="val" data-kpi-enrolled>3<small> 강</small></div>
      <div class="sub"><span class="trend">▲ 1</span> 이번 달 신규</div>
    </div>
    <div class="kpi green"><span class="accentbar"></span>
      <div class="top"><span class="ic"><i class="icn icn-clock"></i></span></div>
      <div class="lb">총 학습시간</div><div class="val" data-kpi="hours">18.5<small>h</small></div>
      <div class="sub"><span class="trend">▲ 2.4h</span> 지난주 대비</div>
    </div>
    <div class="kpi amber"><span class="accentbar"></span>
      <div class="top"><span class="ic"><i class="icn icn-flame"></i></span></div>
      <div class="lb">연속 학습</div><div class="val" data-kpi="streak">7<small>일</small></div>
      <div class="streakbars" data-streakbars><i class="on"></i><i class="on"></i><i class="on"></i><i class="on"></i><i class="on"></i><i class="on"></i><i class="on"></i></div>
    </div>
    <div class="kpi"><span class="accentbar"></span>
      <div class="top"><span class="ic"><i class="icn icn-cap"></i></span></div>
      <div class="lb">수료 완료</div><div class="val">1<small> 개</small></div>
      <div class="sub" data-kpi="next-cert">다음 수료까지 <b style="color:var(--color-text)">62%</b></div>
    </div>
  </div>
</div>

<div class="container section" data-tabscope>
  <div class="tabs">
    <span class="tab on" data-tab="my">내 강의</span>
    <span class="tab" data-tab="cert">수료증</span>
    <span class="tab" data-tab="pay">결제내역</span>
    <span class="tab" data-tab="noti">알림</span>
    <span class="tab" data-tab="prof">프로필</span>
    <a class="tab" href="/referrals" style="text-decoration:none">추천·보상</a>
  </div>

  <!-- 내 강의 -->
  <div data-panel="my">
    <!-- 전 과정 마스터 배지/배너 (JS가 채움) -->
    <div data-master class="mastercard"></div>

    <div class="grid g3" data-mycourses>
      <div class="cc" style="cursor:default"><div class="th photo" style="background-image:url(/assets/course-conversation.jpg)"><span class="cat">회화</span><span class="lv">수강중</span></div><div class="in"><div class="ti">초·중등 데일리 영어회화 30일</div><div class="bar" style="margin:8px 0"><i data-course-bar style="width:43%"></i></div><div class="mt"><span class="muted" data-course-pct>진도 43%</span><span class="badge red">D-72</span></div><a class="btn btn-primary btn-block btn-sm" href="/player" style="margin-top:10px">이어보기</a></div></div>
      <div class="cc" style="cursor:default"><div class="th photo" style="background-image:url(/assets/course-exam.jpg)"><span class="cat">내신</span><span class="lv">수료</span></div><div class="in"><div class="ti">중등 내신 영어 완성</div><div class="bar" style="margin:8px 0"><i class="done" style="width:100%"></i></div><div class="mt"><span class="badge green"><i class="icn icn-check"></i> 수료완료</span><span class="muted">무제한</span></div><button class="btn btn-ghost btn-block btn-sm" data-act="modal-open" data-target="certModal" style="margin-top:10px"><i class="icn icn-cap"></i> 수료증 보기</button></div></div>
      <div class="cc" style="cursor:default"><div class="th photo" style="background-image:url(/assets/course-starter.jpg)"><span class="cat">파닉스</span><span class="lv">무료</span></div><div class="in"><div class="ti">초등 영어 파닉스</div><div class="bar" style="margin:8px 0"><i style="width:12%"></i></div><div class="mt"><span class="muted">진도 12%</span><span class="badge gray">무료</span></div><a class="btn btn-primary btn-block btn-sm" href="/player" style="margin-top:10px">이어보기</a></div></div>
    </div>

    <!-- 이번 주 학습 (풀폭) -->
    <div class="panel-card" style="margin-top:18px">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap">
        <b style="font-size:14.5px">이번 주 학습</b>
        <span class="muted" style="font-size:12px">이번 주 <b style="color:var(--color-primary)"><span data-week-total>95</span>분</b> · 주간 목표 <b style="color:var(--color-text)">5일</b> 중 <b style="color:var(--color-primary)" data-week-done>4</b>일 완료</span>
      </div>
      <div class="weekgrid" data-weekgrid>
        <div class="wcol"><div class="wval">25</div><div class="wtrack"><i class="wbar l2" style="height:81%"></i></div><div class="dl">월</div></div>
        <div class="wcol"><div class="wval">12</div><div class="wtrack"><i class="wbar l1" style="height:39%"></i></div><div class="dl">화</div></div>
        <div class="wcol"><div class="wval">31</div><div class="wtrack"><i class="wbar l3" style="height:100%"></i></div><div class="dl">수</div></div>
        <div class="wcol"><div class="wval">18</div><div class="wtrack"><i class="wbar l2" style="height:58%"></i></div><div class="dl">목</div></div>
        <div class="wcol"><div class="wval">0</div><div class="wtrack"><i class="wbar" style="height:0%"></i></div><div class="dl">금</div></div>
        <div class="wcol today"><div class="wval">9</div><div class="wtrack"><i class="wbar l1" style="height:29%"></i></div><div class="dl">토</div></div>
        <div class="wcol future"><div class="wval"></div><div class="wtrack"><i class="wbar" style="height:0%"></i></div><div class="dl">일</div></div>
      </div>
      <div class="heatlegend">적음 <i class="h0"></i><i class="h1"></i><i class="h2"></i><i class="h3"></i> 많음 <span style="margin-left:8px">(분 단위)</span></div>
    </div>

    <!-- 단원평가 + 학부모 리포트 -->
    <div class="grid g-2col" style="margin-top:18px">
      <div class="panel-card" id="unittests" style="scroll-margin-top:84px">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px">
          <b style="font-size:14.5px">단원평가</b>
          <span class="muted" style="font-size:12px">섹션을 끝내면 평가가 열려요</span>
        </div>
        <div class="unittests" data-unittests></div>
      </div>
      <div class="panel-card report-card">
        <b style="font-size:14.5px">학부모 리포트</b>
        <p class="muted" style="font-size:12px;line-height:1.6;margin:8px 0 14px">이번 주 학습 시간·진도·퀴즈·단원평가를 한눈에. 학부모님께 공유하세요.</p>
        <button class="btn btn-primary btn-block btn-sm" data-report-open><i class="icn icn-clipboard"></i> 이번 주 리포트 보기</button>
        <div class="muted" style="font-size:11px;margin-top:10px">매주 일요일 자동 정리됩니다.</div>
      </div>
    </div>

    <!-- 다 들으면 이런 강의도 (학습 경로 안내 · 보조) -->
    <div class="nextstep" style="margin-top:18px">
      <div class="nextstep-txt">
        <span class="muted" style="font-size:11.5px;letter-spacing:.04em;font-weight:700">회화를 끝내면 다음 단계</span>
        <b style="font-size:14px;display:block;margin-top:3px">중등 독해·어휘 부스터</b>
        <span class="muted" style="font-size:12.5px">김하영 원장 · 13강 — 회화 다음 학습 흐름으로 자연스럽게 이어져요.</span>
      </div>
      <a href="/course" class="btn btn-ghost btn-sm">미리보기 <span class="arr">→</span></a>
    </div>
  </div>

  <!-- 수료증 -->
  <div data-panel="cert" style="display:none">
    <div class="card flat" style="padding:20px;display:flex;align-items:center;gap:16px;max-width:560px">
      <div class="gx-sky" style="width:90px;height:64px;border-radius:var(--radius-md);display:flex;align-items:center;justify-content:center;color:#fff;font-size:24px"><i class="icn icn-cap"></i></div>
      <div style="flex:1"><div style="font-weight:700">중등 내신 영어 완성</div><div class="muted" style="font-size:12.5px">수료번호 EPIC-2026-0512 · 2026-05-30 발급</div></div>
      <button class="btn btn-primary btn-sm" data-act="modal-open" data-target="certModal">PDF 보기</button>
    </div>
  </div>

  <!-- 결제내역 -->
  <div data-panel="pay" style="display:none">
    <div class="card flat" style="padding:4px 16px">
      <table>
        <tr><th>주문일</th><th>강의</th><th>금액</th><th>상태</th><th></th></tr>
        <tr><td>2026-06-01</td><td>초·중등 데일리 영어회화 30일</td><td>₩56,100</td><td><span class="badge green">결제완료</span></td><td style="text-align:right"><button class="btn btn-ghost btn-sm" data-act="toast" data-msg="현금영수증을 발급했습니다">영수증</button> <button class="btn btn-ghost btn-sm" data-act="toast" data-msg="환불 요청이 접수되었습니다 (진도율 기준 산정)">환불요청</button></td></tr>
        <tr><td>2026-05-12</td><td>중등 내신 영어 완성</td><td>₩55,000</td><td><span class="badge green">결제완료</span></td><td style="text-align:right"><button class="btn btn-ghost btn-sm" data-act="toast" data-msg="세금계산서를 발급했습니다">영수증</button></td></tr>
        <tr><td>2026-04-20</td><td>원어민 발음 클리닉</td><td>₩72,000</td><td><span class="badge red">환불완료</span></td><td style="text-align:right"><span class="muted" style="font-size:11px">진도율 12% · 1/2환급</span></td></tr>
      </table>
    </div>
  </div>

  <!-- 알림 -->
  <div data-panel="noti" style="display:none">
    <div class="card flat" style="padding:14px 16px;margin-bottom:8px;display:flex;gap:10px"><span class="ni-ic"><i class="icn icn-card"></i></span><div><b style="font-size:13px">결제가 완료되었습니다</b><div class="muted" style="font-size:12px">초·중등 데일리 영어회화 30일 · 2일 전</div></div></div>
    <div class="card flat" style="padding:14px 16px;margin-bottom:8px;display:flex;gap:10px"><span class="ni-ic"><i class="icn icn-message"></i></span><div><b style="font-size:13px">Q&A 답변이 등록되었습니다</b><div class="muted" style="font-size:12px">"좋아하는 과목 말하기" 질문 · 2일 전</div></div></div>
    <div class="card flat" style="padding:14px 16px;display:flex;gap:10px"><span class="ni-ic"><i class="icn icn-clock"></i></span><div><b style="font-size:13px">수강기간 만료 임박 (D-7)</b><div class="muted" style="font-size:12px">초·중등 데일리 영어회화 30일 · 오늘</div></div></div>
  </div>

  <!-- 프로필 -->
  <div data-panel="prof" style="display:none">
    <div class="card flat" style="padding:20px;max-width:420px">
      <div class="field"><label>이름</label><input class="input" data-username-input value="홍길동"></div>
      <div class="field"><label>이메일</label><input class="input" value="user@epic.com" disabled></div>
      <div style="display:flex;gap:8px;align-items:center;margin-top:4px">
        <button class="btn btn-primary" data-act="toast" data-msg="프로필을 저장했습니다">저장</button>
        <button class="btn btn-ghost" data-act="logout">로그아웃</button>
      </div>
    </div>
  </div>
</div>

<!-- 수료증 모달 -->
<div id="certModal" data-modal style="display:none;position:fixed;inset:0;background:rgba(8,12,20,.6);align-items:center;justify-content:center;z-index:100;padding:20px">
  <div class="card" style="max-width:480px;width:100%;padding:0;overflow:hidden">
    <div style="background:linear-gradient(135deg,var(--blue-500),var(--blue-700));color:#fff;padding:30px;text-align:center">
      <div class="modal-bigicon"><i class="icn icn-cap"></i></div>
      <div style="font-weight:800;font-size:20px;margin-top:8px">수료증 · Certificate</div>
      <div style="opacity:.85;font-size:12px;margin-top:4px">EVERY PERSON IS CURIOUS</div>
    </div>
    <div style="padding:24px;text-align:center">
      <p class="muted" style="font-size:13px">아래 학습자는 과정을 성실히 수료하였음을 증명합니다.</p>
      <div style="font-size:18px;font-weight:800;margin:10px 0" data-username>홍길동</div>
      <div style="font-size:13px">중등 내신 영어 완성 · 평균 88점</div>
      <div class="muted" style="font-size:11.5px;margin-top:6px">수료번호 EPIC-2026-0512 · 2026-05-30</div>
      <div style="display:flex;gap:8px;justify-content:center;margin-top:18px">
        <button class="btn btn-primary btn-sm" data-act="toast" data-msg="PDF를 다운로드합니다">PDF 다운로드</button>
        <button class="btn btn-ghost btn-sm" data-act="modal-close">닫기</button>
      </div>
    </div>
  </div>
</div>
<!-- 마스터 수료증 모달 (골드) -->
<div id="masterCertModal" data-modal style="display:none;position:fixed;inset:0;background:rgba(8,12,20,.6);align-items:center;justify-content:center;z-index:100;padding:20px">
  <div class="card" style="max-width:480px;width:100%;padding:0;overflow:hidden">
    <div style="background:var(--grad-amber);color:#3b2600;padding:30px;text-align:center">
      <div class="modal-bigicon"><i class="icn icn-trophy"></i></div>
      <div style="font-weight:800;font-size:20px;margin-top:8px">전 과정 마스터 · Master Certificate</div>
      <div style="opacity:.8;font-size:12px;margin-top:4px">EVERY PERSON IS CURIOUS</div>
    </div>
    <div style="padding:24px;text-align:center">
      <p class="muted" style="font-size:13px">아래 학습자는 모든 단원평가를 통과하여 전 과정을 마스터하였음을 증명합니다.</p>
      <div style="font-size:18px;font-weight:800;margin:10px 0" data-username>홍길동</div>
      <div style="font-size:13px">초·중등 데일리 영어회화 30일</div>
      <div style="font-size:13px;margin-top:4px">단원평가 평균 <b data-master-avg>—</b></div>
      <div class="muted" style="font-size:11.5px;margin-top:6px">EPIC 전 과정 마스터 인증 · 4개 단원평가 전부 통과</div>
      <div style="display:flex;gap:8px;justify-content:center;margin-top:18px">
        <button class="btn btn-accent btn-sm" data-act="toast" data-msg="마스터 수료증 PDF를 다운로드합니다">PDF 다운로드</button>
        <button class="btn btn-ghost btn-sm" data-act="modal-close">닫기</button>
      </div>
    </div>
  </div>
</div>
<!-- 단원평가 모달 -->
<div id="unitModal" data-modal style="display:none;position:fixed;inset:0;background:rgba(8,12,20,.6);align-items:center;justify-content:center;z-index:100;padding:20px">
  <div class="card" style="max-width:520px;width:100%;max-height:88vh;overflow:auto;padding:0">
    <div class="utmhead">
      <div><b data-unit-title style="font-size:15.5px">단원평가</b><div class="muted" style="font-size:11.5px">정답을 고르고 채점하기를 누르세요</div></div>
      <button class="btn btn-ghost btn-sm" data-act="modal-close"><i class="icn icn-x"></i></button>
    </div>
    <div style="padding:18px 20px 22px" data-unit-body></div>
  </div>
</div>

<!-- 학부모 리포트 모달 -->
<div id="reportModal" data-modal style="display:none;position:fixed;inset:0;background:rgba(8,12,20,.6);align-items:center;justify-content:center;z-index:100;padding:20px">
  <div class="card" style="max-width:520px;width:100%;max-height:88vh;overflow:auto;padding:0">
    <div style="background:linear-gradient(135deg,var(--blue-500),var(--blue-700));color:#fff;padding:22px 24px">
      <div style="font-size:12px;opacity:.85;font-weight:700">EPIC 학부모 리포트</div>
      <div style="font-size:19px;font-weight:800;margin-top:2px">우리 아이 이번 주 학습 요약</div>
    </div>
    <div style="padding:20px 24px 8px" data-report-body></div>
    <div style="padding:6px 24px 22px;display:flex;gap:8px;justify-content:flex-end">
      <button class="btn btn-primary btn-sm" data-act="toast" data-msg="리포트를 PDF로 저장했어요">PDF로 저장</button>
      <button class="btn btn-ghost btn-sm" data-act="modal-close">닫기</button>
    </div>
  </div>
</div>
`

// HTML 이스케이프(코스 제목 등 DB 값 주입 시 안전).
function esc(s: string): string {
  return s.replace(
    /[&<>"']/g,
    (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string,
  )
}

// 만료일까지 남은 일수(D-day). null이면 무제한.
function dday(expiresAt: string | null): number | null {
  if (!expiresAt) return null
  const ms = new Date(expiresAt).getTime() - Date.now()
  return Math.ceil(ms / 86_400_000)
}

// 수강건 1개 → 카드 HTML. 정적 데모 카드(.cc)와 동일 구조.
function cardHtml(e: Enrollment): string {
  const pct = e.progress.pct
  const done = pct >= 100 || e.status === 'cancelled'
  const thumb = e.course.thumbnail_url || '/assets/course-conversation.jpg'
  const lv = e.status === 'expired' ? '만료' : pct >= 100 ? '수료' : '수강중'

  // 상태 배지: 수료 / 만료 / D-day(active) / 무제한
  const d = dday(e.expires_at)
  let badge: string
  if (pct >= 100) badge = '<span class="badge green"><i class="icn icn-check"></i> 수료완료</span>'
  else if (e.status === 'expired') badge = '<span class="badge gray">만료</span>'
  else if (d == null) badge = '<span class="muted">무제한</span>'
  else if (d <= 7) badge = `<span class="badge red">D-${Math.max(d, 0)}</span>`
  else badge = `<span class="badge gray">D-${d}</span>`

  const barClass = pct >= 100 ? 'done' : ''
  const cta = done
    ? '<a class="btn btn-ghost btn-block btn-sm" href="/player" style="margin-top:10px">다시보기</a>'
    : '<a class="btn btn-primary btn-block btn-sm" href="/player" style="margin-top:10px">이어보기</a>'

  return `<div class="cc" style="cursor:default">
    <div class="th photo" style="background-image:url(${esc(thumb)})"><span class="lv">${lv}</span></div>
    <div class="in">
      <div class="ti">${esc(e.course.title)}</div>
      <div class="bar" style="margin:8px 0"><i class="${barClass}" style="width:${pct}%"></i></div>
      <div class="mt"><span class="muted">진도 ${pct}%</span>${badge}</div>
      ${cta}
    </div>
  </div>`
}

// 수강목록을 실데이터로 교체. 비어있거나 미로그인이면 정적 데모 유지.
async function hydrateEnrollments(root: Element) {
  const list = await fetchMyEnrollments()
  if (!list) return // null = 미로그인/실패/빈 목록 → 정적 데모 보존

  const grid = root.querySelector('[data-mycourses]')
  if (grid) grid.innerHTML = list.map(cardHtml).join('')

  // KPI "수강 중" = active 상태 수강건 수
  const activeCount = list.filter((e) => e.status === 'active' && e.progress.pct < 100).length
  const kpi = root.querySelector('[data-kpi-enrolled]')
  if (kpi) kpi.innerHTML = `${activeCount}<small> 강</small>`
}

export default function Mypage() {
  useEffect(() => {
    initDashboard()
    initLiveSync()
    const root = document.querySelector('[data-dashboard]')
    if (!root) return
    // 로그인 유저가 있으면 인사·프로필 이름을 실제 이름으로(미로그인/데모면 기본값 유지)
    const name = getStoredUser()?.name?.trim()
    if (name && name !== '홍길동') {
      root.querySelectorAll('[data-username]').forEach((el) => {
        el.textContent = name
      })
      const input = root.querySelector('[data-username-input]')
      if (input instanceof HTMLInputElement) input.value = name
    }
    // 수강목록 실데이터 연동(/me/enrollments). 폴백: 정적 데모.
    void hydrateEnrollments(root)
  }, [])
  return <div data-dashboard dangerouslySetInnerHTML={{ __html: BODY }} />
}
