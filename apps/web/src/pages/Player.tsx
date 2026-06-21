import { useEffect, useMemo, useState } from 'react'
import { initLesson } from '../lib/engine'
import {
  recordActivation,
  saveProgress,
  getAccessToken,
  fetchCourseCurriculum,
  fetchCourseProgress,
  type Curriculum,
  type CurriculumLecture,
  type LectureProgress,
} from '../lib/api'

// 첫 강의 수강(활성화) 백엔드 기록 1회 — ADR 0006 추천인 보상 트리거.
// 영상이 정적 목업이라 "재생"의 충실한 신호 = 플레이어에 유효한 레슨이 처음 로드된 순간.
// 미로그인(토큰 없음)이면 자동 건너뜀 → 인증 연동 후 첫 레슨 진입 시 발화.
// 성공해야 플래그를 set(서버가 호출마다 퍼널 이벤트를 남기므로 중복 발화 방지).
const ACTIVATION_FLAG = 'epic-activation-sent'
async function maybeRecordActivation() {
  try {
    if (localStorage.getItem(ACTIVATION_FLAG) === '1') return
  } catch {
    return
  }
  const res = await recordActivation()
  if (res.ok) {
    try {
      localStorage.setItem(ACTIVATION_FLAG, '1')
    } catch {
      /* localStorage 불가 환경 무시 */
    }
  }
}

/* 강의실(player) — 밝은 셸 + 다크 영상 프레임.
   두 모드:
   - 리얼 모드: ?course=<id> → 실제 DB 커리큘럼/진도를 불러 실 lecture id로 재생목록·본문을
     렌더하고, 레슨 진입·완료를 /me/progress에 자동 적재(수강목록 진도율의 실토대).
   - 데모 모드: ?course 없음 → 기존 정적 엔진(engine.ts initLesson)으로 목업 커리큘럼 렌더.
   정적 셸 스타일은 docs/pages/player.html 과 동일하게 공유한다. */

const STYLE = `
  /* 밝은 셸 — 영상 프레임만 다크 */
  .ptop{position:sticky;top:0;z-index:50;background:rgba(255,255,255,.86);-webkit-backdrop-filter:blur(12px) saturate(1.4);backdrop-filter:blur(12px) saturate(1.4);border-bottom:1px solid var(--color-border)}
  .ptop .inner{max-width:1680px;margin:0 auto;padding:12px 28px;display:flex;align-items:center;gap:16px}
  .ptop .wm b{color:var(--color-text)}.ptop .wm i{color:var(--color-text-muted)}
  .ptop .prog{color:var(--color-text-muted);font-size:12.5px;display:flex;align-items:center;gap:8px}
  .ptop .prog .pbar{width:84px;height:6px;border-radius:999px;background:var(--color-surface-alt);overflow:hidden}
  .ptop .prog .pbar i{display:block;height:100%;width:38%;background:var(--grad-primary)}
  .ptop .list{border:1px solid var(--color-border);background:var(--color-surface);color:var(--color-text)}
  .ptop .list:hover{background:var(--color-surface-alt)}
  .player{max-width:1680px;margin:0 auto;display:grid;grid-template-columns:1fr 360px}
  .player>*{min-width:0}
  .pmain{background:var(--color-surface);border-right:1px solid var(--color-border);min-width:0}
  /* 영상 프레임: 밝은 셸 위에 떠 있는 다크 카드 */
  .stage{padding:20px 22px 4px}
  /* 와이드 셸에서 영상이 화면 높이를 넘지 않도록 16:9 기준 상한 */
  .stage .video{max-width:calc((100vh - 150px) * 16 / 9);margin-inline:auto}
  .video{position:relative;aspect-ratio:16/9;background:radial-gradient(120% 120% at 50% 0%,#11161f,#070a0f);border-radius:var(--radius-lg);overflow:hidden;display:flex;align-items:center;justify-content:center;box-shadow:var(--shadow-lg);border:1px solid #00000014}
  .quiz-overlay{position:absolute;inset:0;background:rgba(8,12,20,.78);-webkit-backdrop-filter:blur(3px);backdrop-filter:blur(3px);display:flex;align-items:center;justify-content:center;padding:22px}
  .vctrl{position:absolute;bottom:0;left:0;right:0;padding:11px 16px;background:linear-gradient(transparent,#000c);display:flex;align-items:center;gap:12px;color:#fff;font-size:12px}
  .vtrack{flex:1;height:5px;background:#fff3;border-radius:999px;position:relative}
  .vtrack i{position:absolute;left:0;top:0;bottom:0;width:38%;background:var(--color-primary);border-radius:999px}
  .speed{background:#fff2;border-radius:6px;padding:3px 9px;cursor:pointer;border:none;color:#fff;font-family:inherit;font-size:12px}
  .pl{background:var(--color-surface);max-height:calc(100vh - 58px);overflow:auto}
  .pl .sh{padding:13px 16px;font-size:12px;font-weight:700;color:var(--color-text-muted);background:var(--color-surface-alt);position:sticky;top:0;z-index:1;border-bottom:1px solid var(--color-border)}
  .pl .it{padding:12px 16px;font-size:12.5px;border-bottom:1px solid var(--color-border);display:flex;align-items:center;gap:9px;cursor:pointer;text-decoration:none;color:inherit;width:100%;text-align:left;background:none;font-family:inherit}
  .pl .it:hover{background:var(--color-surface-alt)}
  .pl .it.cur{background:var(--color-primary-soft)}
  .ck{width:17px;height:17px;border-radius:50%;border:2px solid var(--color-border-strong);flex-shrink:0;font-size:9px;display:flex;align-items:center;justify-content:center;color:#fff}
  .ck.done{background:var(--color-success);border-color:var(--color-success)}
  .ck.cur{border-color:var(--color-primary);color:var(--color-primary)}
  @media(max-width:860px){.player{grid-template-columns:1fr}.pmain{border-right:none}.pl{border-top:1px solid var(--color-border)}}
`

/* ========================= 데모 모드(정적 엔진) ========================= */

const DEMO_BODY = `
<div class="ptop"><div class="inner">
  <a class="logo" href="/course"><span class="ico mark"><svg viewBox="0 0 24 24" fill="#fff" aria-hidden="true"><path d="M9 7.3v9.4l7.2-4.7z"/></svg></span><span class="wm"><b>EPIC<em style="color:var(--amber-400);font-style:normal">.</em></b><i>초·중등 데일리 영어회화 30일</i></span></a>
  <div style="margin-left:auto;display:flex;gap:14px;align-items:center"><span class="prog">진도 38%<span class="pbar"><i></i></span></span><a class="btn btn-sm list" href="/course">강의목록</a></div>
</div></div>

<div class="player">
  <div class="pmain">
    <div class="stage">
    <div class="video">
      <div style="width:66px;height:66px;border-radius:50%;background:rgba(255,255,255,.16);display:flex;align-items:center;justify-content:center;color:#fff;font-size:22px"><i class="icn icn-play"></i></div>
      <div style="position:absolute;top:12px;right:14px;font-size:10px;color:rgba(255,255,255,.5)">user@epic.com · 워터마크</div>
      <div style="position:absolute;top:12px;left:14px;font-size:10px;color:#fff;background:rgba(0,0,0,.4);padding:4px 9px;border-radius:999px"><i class="icn icn-lock"></i> 최초 수강 빨리감기 제한</div>
      <!-- 인라인 퀴즈 게이팅 (클릭 가능) -->
      <div class="quiz-overlay">
        <div class="card quiz" style="max-width:440px;width:100%;padding:24px">
          <div class="badge accent" style="margin-bottom:10px"><i class="icn icn-pause"></i> 진행 퀴즈 · 정답 시 계속 재생</div>
          <div style="font-weight:700;font-size:15px;margin-bottom:14px">수업 시간에 "질문해도 될까요?"를 영어로 알맞게 표현한 것은?</div>
          <div style="display:flex;flex-direction:column;gap:8px">
            <button class="btn btn-ghost quiz-opt" style="justify-content:flex-start">① Question me, please.</button>
            <button class="btn btn-ghost quiz-opt" data-correct="1" style="justify-content:flex-start">② Can I ask a question?</button>
            <button class="btn btn-ghost quiz-opt" style="justify-content:flex-start">③ I have question you.</button>
          </div>
          <div class="muted" style="font-size:11px;margin-top:12px">정답을 선택해야 다음 구간으로 진행됩니다.</div>
        </div>
      </div>
      <div class="vctrl">
        <span><i class="icn icn-play"></i></span><span>12:05</span><div class="vtrack"><i></i></div><span>31:40</span>
        <button class="speed" data-act="speed" data-cur="1.5x">1.5x <i class="icn icn-chevron"></i></button><span><i class="icn icn-maximize"></i></span>
      </div>
    </div>
    </div>
    <div style="padding:16px 22px 22px" data-tabscope data-lesson>
      <div class="muted" style="padding:40px 0;text-align:center;font-size:13px">강의를 불러오는 중…</div>
    </div>
  </div>
  <!-- 재생목록 -->
  <div class="pl"><div class="sh" style="color:var(--color-text-muted)">재생목록</div></div>
</div>
`

function DemoPlayer() {
  useEffect(() => {
    initLesson()
    // 유효한 레슨이 로드된 뒤(=수강 시작) 활성화 1회 기록.
    // initLesson()이 동기적으로 [data-lesson]에 data-lesson-id를 세팅한다.
    const root = document.querySelector('[data-lesson]')
    const lessonId = root?.getAttribute('data-lesson-id')
    if (lessonId) {
      void maybeRecordActivation()
      // 진도 쓰기 경로 — 실제 DB lecture id(숫자)일 때만 발화.
      // 정적 커리큘럼의 "1-1" 목업 id면 saveProgress가 'not-real-lecture'로 건너뜀.
      void saveProgress({ lectureId: lessonId })
    }
  }, [])
  return <div dangerouslySetInnerHTML={{ __html: DEMO_BODY }} />
}

/* ========================= 리얼 모드(DB 커리큘럼) ========================= */

function fmtDuration(sec: number): string {
  if (!sec || sec < 0) return '—'
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

function RealPlayer({
  courseId,
  initialLesson,
}: {
  courseId: string
  initialLesson: string | null
}) {
  const [curriculum, setCurriculum] = useState<Curriculum | null>(null)
  const [progress, setProgress] = useState<Record<string, LectureProgress>>({})
  const [currentId, setCurrentId] = useState<string | null>(null)
  const [state, setState] = useState<'loading' | 'ready' | 'notfound'>('loading')
  const [saving, setSaving] = useState(false)
  const loggedIn = !!getAccessToken()

  const lectures = useMemo<CurriculumLecture[]>(
    () => (curriculum ? curriculum.sections.flatMap((s) => s.lectures) : []),
    [curriculum],
  )

  // 최초 로드 — 커리큘럼 + 내 진도. 시작 레슨 선택.
  useEffect(() => {
    let alive = true
    void (async () => {
      const [c, p] = await Promise.all([
        fetchCourseCurriculum(courseId),
        fetchCourseProgress(courseId),
      ])
      if (!alive) return
      if (!c || c.sections.every((s) => s.lectures.length === 0)) {
        setState('notfound')
        return
      }
      setCurriculum(c)
      setProgress(p)
      const flat = c.sections.flatMap((s) => s.lectures)
      let start = flat.find((l) => l.id === initialLesson)?.id
      if (!start) start = flat.find((l) => !p[l.id]?.completed)?.id
      if (!start) start = flat[0]?.id ?? null
      setCurrentId(start ?? null)
      setState('ready')
    })()
    return () => {
      alive = false
    }
  }, [courseId, initialLesson])

  // 현재 레슨 진입 시 — 활성화 1회 + "수강 시작" 진도 적재(실 lecture id).
  useEffect(() => {
    if (!currentId) return
    void maybeRecordActivation()
    void saveProgress({ lectureId: currentId })
  }, [currentId])

  const total = lectures.length
  const completedCount = lectures.filter((l) => progress[l.id]?.completed).length
  const pct = total > 0 ? Math.round((completedCount / total) * 100) : 0

  async function markComplete(id: string) {
    if (!loggedIn || saving) return
    setSaving(true)
    const res = await saveProgress({ lectureId: id, completed: true })
    setSaving(false)
    if (res.ok) {
      setProgress((prev) => ({
        ...prev,
        [id]: {
          lecture_id: id,
          completed: true,
          last_position: prev[id]?.last_position ?? 0,
          watched_seconds: prev[id]?.watched_seconds ?? 0,
        },
      }))
      // 자동 다음 강 이동.
      const idx = lectures.findIndex((l) => l.id === id)
      const next = lectures[idx + 1]
      if (next) setCurrentId(next.id)
    }
  }

  if (state === 'loading') {
    return (
      <div
        className="muted"
        style={{ padding: '80px 0', textAlign: 'center', fontSize: 13 }}
      >
        강의를 불러오는 중…
      </div>
    )
  }
  if (state === 'notfound' || !curriculum) {
    return (
      <div style={{ padding: '80px 22px', textAlign: 'center' }}>
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>
          커리큘럼을 찾을 수 없어요
        </div>
        <div className="muted" style={{ fontSize: 13, marginBottom: 16 }}>
          공개된 강의가 아니거나 아직 강의가 등록되지 않았어요.
        </div>
        <a className="btn btn-primary btn-sm" href="/">
          전체 강의로
        </a>
      </div>
    )
  }

  const current = lectures.find((l) => l.id === currentId) ?? null
  const idx = current ? lectures.findIndex((l) => l.id === current.id) : -1
  const next = idx >= 0 ? lectures[idx + 1] : undefined
  const currentDone = current ? !!progress[current.id]?.completed : false

  return (
    <>
      <div className="ptop">
        <div className="inner">
          <a className="logo" href="/">
            <span className="ico mark">
              <svg viewBox="0 0 24 24" fill="#fff" aria-hidden="true">
                <path d="M9 7.3v9.4l7.2-4.7z" />
              </svg>
            </span>
            <span className="wm">
              <b>
                EPIC
                <em style={{ color: 'var(--amber-400)', fontStyle: 'normal' }}>
                  .
                </em>
              </b>
              <i>{curriculum.course.title}</i>
            </span>
          </a>
          <div
            style={{
              marginLeft: 'auto',
              display: 'flex',
              gap: 14,
              alignItems: 'center',
            }}
          >
            <span className="prog">
              진도 {pct}%
              <span className="pbar">
                <i style={{ width: `${pct}%` }} />
              </span>
            </span>
            <a className="btn btn-sm list" href="/mypage">
              내 강의
            </a>
          </div>
        </div>
      </div>

      <div className="player">
        <div className="pmain">
          <div className="stage">
            <div className="video">
              <div
                style={{
                  width: 66,
                  height: 66,
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,.16)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontSize: 22,
                }}
              >
                <i className="icn icn-play" />
              </div>
              <div
                style={{
                  position: 'absolute',
                  top: 12,
                  left: 14,
                  fontSize: 10,
                  color: '#fff',
                  background: 'rgba(0,0,0,.4)',
                  padding: '4px 9px',
                  borderRadius: 999,
                }}
              >
                영상 연결 예정 · Cloudflare Stream(ADR 0002)
              </div>
            </div>
          </div>

          <div style={{ padding: '18px 22px 24px' }}>
            <div className="muted" style={{ fontSize: 12, marginBottom: 4 }}>
              {current ? fmtDuration(current.duration) : ''}
              {current?.is_preview ? ' · 미리보기' : ''}
            </div>
            <h1 style={{ fontSize: 20, fontWeight: 800, marginBottom: 14 }}>
              {current ? current.title : '강의를 선택하세요'}
            </h1>

            {!loggedIn && (
              <div
                className="card"
                style={{ padding: 14, marginBottom: 14, fontSize: 13 }}
              >
                <span className="muted">
                  로그인하면 학습 진도가 저장되고 마이페이지에 반영돼요.
                </span>{' '}
                <a href="/login" style={{ fontWeight: 700 }}>
                  로그인 →
                </a>
              </div>
            )}

            {current && (
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                {currentDone ? (
                  <span className="badge green">
                    <i className="icn icn-check" /> 이 강의 완료
                  </span>
                ) : (
                  <button
                    className="btn btn-primary"
                    disabled={!loggedIn || saving}
                    onClick={() => markComplete(current.id)}
                  >
                    {saving ? '저장 중…' : '이 강의 완료'}
                  </button>
                )}
                {next && (
                  <button
                    className="btn btn-ghost"
                    onClick={() => setCurrentId(next.id)}
                  >
                    다음 강 <span className="arr">→</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="pl">
          {curriculum.sections.map((sec) => (
            <div key={sec.id}>
              <div className="sh">{sec.title}</div>
              {sec.lectures.map((l) => {
                const done = !!progress[l.id]?.completed
                const cur = l.id === currentId
                return (
                  <button
                    key={l.id}
                    className={`it${cur ? ' cur' : ''}`}
                    onClick={() => setCurrentId(l.id)}
                  >
                    <span
                      className={`ck${done ? ' done' : cur ? ' cur' : ''}`}
                    >
                      {done ? <i className="icn icn-check" /> : ''}
                    </span>
                    <span style={{ flex: 1 }}>{l.title}</span>
                    <span className="muted" style={{ fontSize: 11 }}>
                      {fmtDuration(l.duration)}
                    </span>
                  </button>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

/* ========================= 디스패처 ========================= */

export default function Player() {
  const params =
    typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search)
      : new URLSearchParams()
  const courseId = params.get('course')
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLE }} />
      {courseId ? (
        <RealPlayer courseId={courseId} initialLesson={params.get('lesson')} />
      ) : (
        <DemoPlayer />
      )}
    </>
  )
}
