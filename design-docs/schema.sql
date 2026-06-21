-- ============================================================
-- 인강 사이트 PostgreSQL 스키마 (DDL)
-- 대상: 100 동접 / 단건·기간제 결제 / 영상 보호수준 3
-- DB: PostgreSQL 14+
-- ============================================================

BEGIN;

-- ----------------------------------------------------------------
-- 확장 / 공통 함수
-- ----------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto";   -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "pg_trgm";     -- 코스 제목 LIKE 검색 가속
CREATE EXTENSION IF NOT EXISTS "citext";      -- 대소문자 무시 이메일

-- updated_at 자동 갱신 트리거 함수
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------
-- ENUM 타입
-- ----------------------------------------------------------------
CREATE TYPE user_role         AS ENUM ('student', 'instructor', 'admin');
CREATE TYPE course_status      AS ENUM ('draft', 'published', 'closed');
CREATE TYPE enrollment_status  AS ENUM ('active', 'expired', 'cancelled');
CREATE TYPE payment_status     AS ENUM ('pending', 'paid', 'failed', 'refunded', 'partially_refunded');
CREATE TYPE discount_type      AS ENUM ('percent', 'fixed');
CREATE TYPE quiz_type          AS ENUM ('inline', 'final');  -- inline: 영상 중간 게이팅 / final: 종료 후 채점
CREATE TYPE refund_status      AS ENUM ('requested', 'approved', 'rejected', 'completed');
CREATE TYPE receipt_type       AS ENUM ('cash_receipt', 'tax_invoice');  -- 현금영수증 / 세금계산서
CREATE TYPE receipt_status     AS ENUM ('requested', 'issued', 'failed', 'cancelled');
-- 멤버십(구독) 관련 (ADR 0008)
CREATE TYPE billing_interval     AS ENUM ('month', 'year');                         -- 멤버십 청구 주기
CREATE TYPE subscription_status  AS ENUM ('active', 'past_due', 'cancelled', 'expired', 'paused');
CREATE TYPE subscription_source  AS ENUM ('paid', 'seed', 'comp');                  -- paid=유료결제 / seed=0006 60명 시딩 / comp=무상제공

-- ----------------------------------------------------------------
-- 1) users
-- ----------------------------------------------------------------
CREATE TABLE users (
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  email         CITEXT            NOT NULL UNIQUE,         -- 대소문자 무시
  password      VARCHAR(255),                            -- bcrypt/argon2 해시. 카카오 전용 계정은 NULL 허용
  name          VARCHAR(100)      NOT NULL,
  role          user_role         NOT NULL DEFAULT 'student',
  kakao_id      VARCHAR(64),                             -- 카카오 OAuth 식별자 (nullable)
  profile_image TEXT,
  created_at    TIMESTAMPTZ       NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ       NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------
-- 2) categories
-- ----------------------------------------------------------------
CREATE TABLE categories (
  id    BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name  VARCHAR(100) NOT NULL,
  slug  VARCHAR(120) NOT NULL UNIQUE
);

-- ----------------------------------------------------------------
-- 3) courses
-- ----------------------------------------------------------------
CREATE TABLE courses (
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  category_id   BIGINT        REFERENCES categories(id) ON DELETE SET NULL,
  instructor_id BIGINT        REFERENCES users(id)      ON DELETE SET NULL,
  title         VARCHAR(200)  NOT NULL,
  description   TEXT,
  thumbnail_url TEXT,
  price         INTEGER       NOT NULL DEFAULT 0 CHECK (price >= 0),  -- KRW 정수(원)
  status        course_status NOT NULL DEFAULT 'draft',
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------
-- 4) sections (Course → Section → Lecture 계층)
-- ----------------------------------------------------------------
CREATE TABLE sections (
  id        BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  course_id BIGINT       NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title     VARCHAR(200) NOT NULL,
  order_no  INTEGER      NOT NULL DEFAULT 0,
  UNIQUE (course_id, order_no)
);

-- ----------------------------------------------------------------
-- 5) lectures
-- ----------------------------------------------------------------
CREATE TABLE lectures (
  id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  section_id   BIGINT       NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
  title        VARCHAR(200) NOT NULL,
  video_uid    VARCHAR(128),                       -- Cloudflare Stream/Mux 자산 UID (외부 URL 직접 노출 금지)
  duration     INTEGER      NOT NULL DEFAULT 0 CHECK (duration >= 0), -- 초
  order_no     INTEGER      NOT NULL DEFAULT 0,
  is_preview   BOOLEAN      NOT NULL DEFAULT false, -- 미리보기 무료 강의
  -- 완청/시청 정책 (업로드 시 강사 설정)
  require_full_watch   BOOLEAN  NOT NULL DEFAULT false,                                         -- 완청 필수 여부
  completion_threshold SMALLINT NOT NULL DEFAULT 90 CHECK (completion_threshold BETWEEN 1 AND 100), -- 완청 인정 비율(%)
  disable_seek         BOOLEAN  NOT NULL DEFAULT false,                                         -- 최초 수강 빨리감기 금지
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ  NOT NULL DEFAULT now(),
  UNIQUE (section_id, order_no)
);

-- ----------------------------------------------------------------
-- 6) attachments (PDF 자료 다운로드)
-- ----------------------------------------------------------------
CREATE TABLE attachments (
  id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  lecture_id BIGINT       NOT NULL REFERENCES lectures(id) ON DELETE CASCADE,
  file_url   TEXT         NOT NULL,           -- S3 객체키 (다운로드는 Signed URL 발급)
  filename   VARCHAR(255) NOT NULL,
  size_bytes BIGINT       NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------
-- 6-1) quizzes (영상 중간 게이팅 퀴즈 + 종료 후 채점 퀴즈)
-- ----------------------------------------------------------------
CREATE TABLE quizzes (
  id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  lecture_id      BIGINT     NOT NULL REFERENCES lectures(id) ON DELETE CASCADE,
  quiz_type       quiz_type  NOT NULL DEFAULT 'inline',
  position_sec    INTEGER    CHECK (position_sec >= 0),       -- inline 게이팅 시점(초). final 은 NULL
  question        TEXT       NOT NULL,
  options         JSONB      NOT NULL,                        -- ["보기1","보기2",...]
  answer          JSONB      NOT NULL,                        -- 정답 인덱스/값 (단일·복수 지원)
  require_correct BOOLEAN    NOT NULL DEFAULT true,           -- 정답이어야 영상 진행(inline)
  points          SMALLINT   NOT NULL DEFAULT 0 CHECK (points >= 0), -- final 채점 배점
  order_no        INTEGER    NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- inline 은 position_sec 필수, final 은 배점(points) 필수
  CHECK ((quiz_type = 'inline' AND position_sec IS NOT NULL)
      OR (quiz_type = 'final'  AND points > 0))
);

-- ----------------------------------------------------------------
-- 6-2) quiz_attempts (퀴즈 응답/채점 이력)
-- ----------------------------------------------------------------
CREATE TABLE quiz_attempts (
  id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id      BIGINT     NOT NULL REFERENCES users(id)   ON DELETE CASCADE,
  quiz_id      BIGINT     NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  selected     JSONB      NOT NULL,                        -- 제출한 답
  is_correct   BOOLEAN    NOT NULL,
  score        SMALLINT   NOT NULL DEFAULT 0 CHECK (score >= 0), -- 획득 점수(final)
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------
-- 7) coupons
-- ----------------------------------------------------------------
CREATE TABLE coupons (
  id             BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  code           VARCHAR(50)   NOT NULL UNIQUE,
  discount_type  discount_type NOT NULL,
  discount_value INTEGER       NOT NULL CHECK (discount_value > 0), -- percent: 1~100, fixed: KRW
  min_amount     INTEGER       NOT NULL DEFAULT 0,                  -- 최소 결제 금액
  max_uses       INTEGER,                                          -- NULL = 무제한
  used_count     INTEGER       NOT NULL DEFAULT 0,
  valid_until    TIMESTAMPTZ,
  created_at     TIMESTAMPTZ   NOT NULL DEFAULT now(),
  CHECK (discount_type <> 'percent' OR discount_value <= 100)
);

-- ----------------------------------------------------------------
-- 7-1) plans (멤버십 요금제 정의 — ADR 0008)
--   * 단건(코스 1개) 구매가는 courses.price 사용. plans 는 "구독형 멤버십"만 정의.
--   * 가격은 ADR 0005(🟡 잠정): 월 19,900 / 연 179,000. 확정 시 데이터만 갱신.
-- ----------------------------------------------------------------
CREATE TABLE plans (
  id             BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  code           VARCHAR(40)      NOT NULL UNIQUE,             -- 'membership_monthly' / 'membership_annual'
  name           VARCHAR(120)     NOT NULL,                    -- '멤버십 월간'
  price          INTEGER          NOT NULL CHECK (price >= 0), -- KRW 정수(원)
  billing_period billing_interval NOT NULL,                    -- month / year
  period_count   SMALLINT         NOT NULL DEFAULT 1 CHECK (period_count > 0), -- 1 = 매월/매년
  trial_days     INTEGER          NOT NULL DEFAULT 0 CHECK (trial_days >= 0),  -- 무료체험 일수(0=없음)
  is_active      BOOLEAN          NOT NULL DEFAULT true,       -- 판매중단 시 false (기존 구독은 유지)
  created_at     TIMESTAMPTZ      NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ      NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------
-- 7-2) subscriptions (구독 상태 — 멤버십 접근 판정의 원천, ADR 0008)
--   * 접근 판정: enrollments(단건) OR (subscription active & current_period_end > now())
--     멤버십 = 전체 published 코스 접근. 등급제(일부 코스)는 후속 plan_courses 매핑으로 확장.
--   * 자동결제: 토스 billing_key 보관, 주기 갱신 배치가 billing_key 로 재청구 → payments row 생성.
--   * 0006 시딩: source='seed', billing_key NULL, current_period_end = 가입+3개월.
-- ----------------------------------------------------------------
CREATE TABLE subscriptions (
  id                   BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id              BIGINT              NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_id              BIGINT              NOT NULL REFERENCES plans(id) ON DELETE RESTRICT,
  status               subscription_status NOT NULL DEFAULT 'active',
  source               subscription_source NOT NULL DEFAULT 'paid',
  billing_key          VARCHAR(255),                            -- 토스 빌링키(자동결제 토큰). 시드/무상은 NULL
  current_period_start TIMESTAMPTZ         NOT NULL DEFAULT now(),
  current_period_end   TIMESTAMPTZ         NOT NULL,            -- 이 시점까지 접근 허용
  cancel_at_period_end BOOLEAN             NOT NULL DEFAULT false, -- 해지 예약(기간말 종료, 즉시 차단 아님)
  cancelled_at         TIMESTAMPTZ,
  created_at           TIMESTAMPTZ         NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ         NOT NULL DEFAULT now(),
  CHECK (current_period_end > current_period_start)
);
-- 1유저당 동시 활성 구독 1개만 (중복 구독 방지)
CREATE UNIQUE INDEX uq_subscriptions_active_user ON subscriptions (user_id) WHERE status = 'active';

-- ----------------------------------------------------------------
-- 8) payments (단건·구독 통합 결제 원장 — ADR 0008로 구독 지원 확장)
--   * 단건: course_id 채움 / 구독: subscription_id 채움. 둘 중 하나는 반드시 존재(CHECK).
--   * 구독 자동결제 1회분마다 payments row 1개(주기 청구 이력).
-- ----------------------------------------------------------------
CREATE TABLE payments (
  id             BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id        BIGINT         NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  course_id      BIGINT         REFERENCES courses(id) ON DELETE RESTRICT,        -- 단건 구매 대상(구독 결제면 NULL)
  subscription_id BIGINT        REFERENCES subscriptions(id) ON DELETE SET NULL,  -- 구독 청구 1회분(단건이면 NULL)
  coupon_id      BIGINT         REFERENCES coupons(id) ON DELETE SET NULL,
  amount         INTEGER        NOT NULL CHECK (amount >= 0),  -- 실제 결제 금액(할인 후)
  pg_provider    VARCHAR(30)    NOT NULL DEFAULT 'toss',       -- toss / portone ...
  pg_tid         VARCHAR(128),                                 -- PG 거래 고유키 (멱등/환불 조회용)
  status         payment_status NOT NULL DEFAULT 'pending',
  refund_amount  INTEGER        NOT NULL DEFAULT 0 CHECK (refund_amount >= 0),
  paid_at        TIMESTAMPTZ,
  refunded_at    TIMESTAMPTZ,
  created_at     TIMESTAMPTZ    NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ    NOT NULL DEFAULT now(),
  UNIQUE (pg_provider, pg_tid),
  CHECK (course_id IS NOT NULL OR subscription_id IS NOT NULL)  -- 단건 또는 구독, 둘 중 하나는 필수
);

-- ----------------------------------------------------------------
-- 9) coupon_redemptions (쿠폰 중복 사용 방지)
-- ----------------------------------------------------------------
CREATE TABLE coupon_redemptions (
  id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  coupon_id  BIGINT      NOT NULL REFERENCES coupons(id)  ON DELETE CASCADE,
  user_id    BIGINT      NOT NULL REFERENCES users(id)    ON DELETE CASCADE,
  payment_id BIGINT      NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (coupon_id, user_id)            -- 1인 1회
);

-- ----------------------------------------------------------------
-- 10) enrollments (수강권: 결제 → 권한 부여, 수강기간 만료)
-- ----------------------------------------------------------------
CREATE TABLE enrollments (
  id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id      BIGINT            NOT NULL REFERENCES users(id)    ON DELETE CASCADE,
  course_id    BIGINT            NOT NULL REFERENCES courses(id)  ON DELETE CASCADE,
  payment_id   BIGINT            REFERENCES payments(id) ON DELETE SET NULL,
  status       enrollment_status NOT NULL DEFAULT 'active',
  purchased_at TIMESTAMPTZ       NOT NULL DEFAULT now(),
  expires_at   TIMESTAMPTZ,                          -- NULL = 무제한 수강
  UNIQUE (user_id, course_id)                        -- 동일 코스 중복 수강 방지
);

-- ----------------------------------------------------------------
-- 11) progress (진도/이어보기/자동수료)
-- ----------------------------------------------------------------
CREATE TABLE progress (
  id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id         BIGINT      NOT NULL REFERENCES users(id)    ON DELETE CASCADE,
  lecture_id      BIGINT      NOT NULL REFERENCES lectures(id) ON DELETE CASCADE,
  watched_seconds   INTEGER     NOT NULL DEFAULT 0 CHECK (watched_seconds >= 0),
  last_position     INTEGER     NOT NULL DEFAULT 0 CHECK (last_position >= 0), -- 이어보기 지점(초)
  -- 완청(전체 시청) 검증용
  covered_seconds   INTEGER     NOT NULL DEFAULT 0 CHECK (covered_seconds >= 0), -- 실제 재생된 고유 구간 합(초)
  watched_intervals JSONB       NOT NULL DEFAULT '[]',                           -- [[start,end],...] 재생 구간(스크럽 가짜완료 방지)
  max_position      INTEGER     NOT NULL DEFAULT 0 CHECK (max_position >= 0),     -- 최대 시청지점(빨리감기 제한)
  completed         BOOLEAN     NOT NULL DEFAULT false,                           -- 완청 임계 도달 시 true
  completed_at      TIMESTAMPTZ,
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, lecture_id)
);

-- ----------------------------------------------------------------
-- 12) bookmarks (챕터 북마크)
-- ----------------------------------------------------------------
CREATE TABLE bookmarks (
  id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id      BIGINT       NOT NULL REFERENCES users(id)    ON DELETE CASCADE,
  lecture_id   BIGINT       NOT NULL REFERENCES lectures(id) ON DELETE CASCADE,
  position_sec INTEGER      NOT NULL CHECK (position_sec >= 0),
  label        VARCHAR(200),
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------
-- 13) reviews (수강평)
-- ----------------------------------------------------------------
CREATE TABLE reviews (
  id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id    BIGINT      NOT NULL REFERENCES users(id)   ON DELETE CASCADE,
  course_id  BIGINT      NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  rating     SMALLINT    NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment    TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, course_id)            -- 1인 1코스 1리뷰
);

-- ----------------------------------------------------------------
-- 14) qna (질문게시판, parent_id 로 답글 트리)
-- ----------------------------------------------------------------
CREATE TABLE qna (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id     BIGINT       NOT NULL REFERENCES users(id)     ON DELETE CASCADE,
  course_id   BIGINT       NOT NULL REFERENCES courses(id)   ON DELETE CASCADE,
  lecture_id  BIGINT       REFERENCES lectures(id) ON DELETE SET NULL, -- 특정 강의 관련 질문(optional)
  parent_id   BIGINT       REFERENCES qna(id) ON DELETE CASCADE,        -- NULL = 질문, 값 있으면 답글
  title       VARCHAR(200),
  content     TEXT         NOT NULL,
  is_answered BOOLEAN      NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------
-- 15) refunds (수강률 기반 비례 환불 — 학원/평생교육법 의무)
-- ----------------------------------------------------------------
CREATE TABLE refunds (
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  payment_id    BIGINT        NOT NULL REFERENCES payments(id) ON DELETE RESTRICT,
  user_id       BIGINT        NOT NULL REFERENCES users(id)    ON DELETE RESTRICT,
  reason        TEXT,
  progress_rate SMALLINT      NOT NULL DEFAULT 0 CHECK (progress_rate BETWEEN 0 AND 100), -- 환불 산정 시 진도율(%)
  refund_amount INTEGER       NOT NULL CHECK (refund_amount >= 0),                          -- 법정 비례 환불액(원)
  status        refund_status NOT NULL DEFAULT 'requested',
  requested_at  TIMESTAMPTZ   NOT NULL DEFAULT now(),
  processed_at  TIMESTAMPTZ
);

-- ----------------------------------------------------------------
-- 16) receipts (현금영수증 / 세금계산서 — 소득세법 발급)
-- ----------------------------------------------------------------
CREATE TABLE receipts (
  id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  payment_id   BIGINT         NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
  receipt_type receipt_type   NOT NULL,
  identifier   VARCHAR(50)    NOT NULL,                 -- 휴대폰번호(현금영수증) / 사업자번호(세금계산서)
  receipt_no   VARCHAR(64),                             -- 발급 번호(국세청/PG)
  status       receipt_status NOT NULL DEFAULT 'requested',
  issued_at    TIMESTAMPTZ,
  created_at   TIMESTAMPTZ    NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------
-- 17) certificates (수료증)
-- ----------------------------------------------------------------
CREATE TABLE certificates (
  id        BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id   BIGINT      NOT NULL REFERENCES users(id)   ON DELETE CASCADE,
  course_id BIGINT      NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  cert_no   VARCHAR(64) NOT NULL UNIQUE,                -- 수료번호
  pdf_url   TEXT,                                       -- 발급 PDF(S3)
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, course_id)                           -- 코스당 1회
);

-- ----------------------------------------------------------------
-- 18) user_sessions (동시접속/기기 제한 — 계정공유 방지)
-- ----------------------------------------------------------------
CREATE TABLE user_sessions (
  id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id      BIGINT       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  refresh_hash VARCHAR(255) NOT NULL,                   -- refresh token 해시(회전/폐기)
  device       VARCHAR(200),                            -- UA/기기 식별
  ip           VARCHAR(64),
  last_seen_at TIMESTAMPTZ  NOT NULL DEFAULT now(),
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT now(),
  expires_at   TIMESTAMPTZ  NOT NULL
  -- 활성 세션 수 제한(예: 2기기)은 앱 레벨에서 강제
);

-- ----------------------------------------------------------------
-- 19) notifications (인앱 알림)
-- ----------------------------------------------------------------
CREATE TABLE notifications (
  id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id    BIGINT       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type       VARCHAR(30)  NOT NULL,                     -- payment/qna_answer/expiry/new_lecture/system
  title      VARCHAR(200) NOT NULL,
  body       TEXT,
  link       TEXT,
  is_read    BOOLEAN      NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------
-- 20) announcements (공지 — 전체/코스)
-- ----------------------------------------------------------------
CREATE TABLE announcements (
  id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  course_id  BIGINT       REFERENCES courses(id) ON DELETE CASCADE, -- NULL = 전체 공지
  title      VARCHAR(200) NOT NULL,
  content    TEXT         NOT NULL,
  pinned     BOOLEAN      NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------
-- 인덱스 (조회 패턴 기준)
-- ----------------------------------------------------------------
CREATE INDEX idx_courses_category      ON courses (category_id) WHERE status = 'published';
CREATE INDEX idx_courses_status        ON courses (status);
CREATE INDEX idx_courses_title_trgm    ON courses USING gin (title gin_trgm_ops); -- 검색
CREATE INDEX idx_sections_course       ON sections (course_id);
CREATE INDEX idx_lectures_section      ON lectures (section_id);
CREATE INDEX idx_attachments_lecture   ON attachments (lecture_id);
CREATE INDEX idx_quizzes_lecture       ON quizzes (lecture_id);
CREATE INDEX idx_quiz_attempts_user    ON quiz_attempts (user_id);
CREATE INDEX idx_quiz_attempts_quiz    ON quiz_attempts (quiz_id);
CREATE INDEX idx_enrollments_user      ON enrollments (user_id);
CREATE INDEX idx_enrollments_course    ON enrollments (course_id);
CREATE INDEX idx_enrollments_expiry    ON enrollments (expires_at) WHERE status = 'active'; -- 만료 배치
CREATE INDEX idx_subscriptions_user    ON subscriptions (user_id);
CREATE INDEX idx_subscriptions_renew   ON subscriptions (current_period_end) WHERE status = 'active'; -- 갱신/만료 배치
CREATE INDEX idx_payments_subscription ON payments (subscription_id);
CREATE INDEX idx_progress_user         ON progress (user_id);
CREATE INDEX idx_bookmarks_user_lec    ON bookmarks (user_id, lecture_id);
CREATE INDEX idx_payments_user         ON payments (user_id);
CREATE INDEX idx_payments_status       ON payments (status);
CREATE INDEX idx_reviews_course        ON reviews (course_id);
CREATE INDEX idx_qna_course            ON qna (course_id);
CREATE INDEX idx_qna_parent            ON qna (parent_id);
CREATE INDEX idx_refunds_payment       ON refunds (payment_id);
CREATE INDEX idx_receipts_payment      ON receipts (payment_id);
CREATE INDEX idx_certificates_user     ON certificates (user_id);
CREATE INDEX idx_user_sessions_user    ON user_sessions (user_id);
CREATE INDEX idx_notifications_unread  ON notifications (user_id) WHERE is_read = false;
CREATE INDEX idx_announcements_course  ON announcements (course_id);

-- ----------------------------------------------------------------
-- updated_at 트리거
-- ----------------------------------------------------------------
CREATE TRIGGER trg_users_updated     BEFORE UPDATE ON users     FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_courses_updated    BEFORE UPDATE ON courses   FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_lectures_updated   BEFORE UPDATE ON lectures  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_payments_updated   BEFORE UPDATE ON payments  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_plans_updated         BEFORE UPDATE ON plans         FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_subscriptions_updated BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_progress_updated   BEFORE UPDATE ON progress  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_reviews_updated    BEFORE UPDATE ON reviews   FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_qna_updated        BEFORE UPDATE ON qna       FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMIT;

-- ================================================================
-- NOTE
--  * users.email 은 CITEXT(대소문자 무시) 사용. 미사용 시 VARCHAR(255)+lower() UNIQUE 인덱스로 대체.
--    필요 시: CREATE EXTENSION IF NOT EXISTS citext;
--  * 금액은 전부 INTEGER(원 단위). 소수점/통화혼용 없음.
--  * 영상은 video_uid 만 저장하고 재생 시 서버가 Signed URL/Token 발급 (URL 직접 미노출).
--  * 완청 판정(앱 레벨): covered_seconds / lectures.duration >= completion_threshold/100
--      → progress.completed=true, completed_at=now()
--      covered_seconds 는 하트비트로 받은 재생구간을 union 누적(스크럽 가짜완료 방지).
--  * 빨리감기 제한: lectures.disable_seek=true 면 max_position 까지만 seek 허용(복습 시 해제).
--  * inline 퀴즈: 영상 position_sec 도달 시 pause→퀴즈, require_correct=true 면 정답 시 진행.
--  * final 퀴즈: 종료 후 일괄 채점, sum(quiz_attempts.score) 로 점수화(수료 조건 연계 가능).
--  * 수강기간 만료(배치): enrollments.expires_at < now() AND status='active' → status='expired'
--  * 환불 산정(법정): 학원의 설립·운영 및 과외교습에 관한 법률 시행령 기준.
--      총 수강시간의 1/3 경과 전 → 2/3 환급, 1/2 경과 전 → 1/2 환급, 1/2 경과 후 → 환급 없음.
--      progress_rate 로 구간 판정 후 refund_amount 산출. (정확한 비율은 운영정책/약관에 명시)
--  * 동시접속 제한: user_sessions 활성 행 수가 한도(예 2) 초과 시 가장 오래된 세션 폐기.
--  * [멤버십/구독 — ADR 0008]
--    - 강의 접근 판정(앱 레벨): 단건 OR 구독 두 경로를 합쳐 판정.
--        canAccess(user, course) =
--          EXISTS enrollment(user, course, status='active', expires_at IS NULL OR > now())
--          OR EXISTS subscription(user, status='active', current_period_end > now())   -- 멤버십=전체 published 코스
--    - 자동결제: 결제 시 토스 빌링키 발급 → subscriptions.billing_key 저장.
--        갱신 배치: current_period_end 임박 active 구독을 billing_key 로 재청구 →
--        성공 시 payments row 생성 + current_period_*  +1주기, 실패 시 status='past_due'(유예 후 expired).
--    - 해지: cancel_at_period_end=true 로 예약(기간말 종료, 잔여기간은 접근 유지). 즉시환불은 단건 비례환불과 별도 정책.
--    - 만료 배치: current_period_end < now() AND status IN('active','past_due') → status='expired'.
--    - 등급제(특정 코스만 멤버십) 필요 시: plan_courses(plan_id, course_id) 매핑 테이블 추가로 확장.
-- ================================================================
