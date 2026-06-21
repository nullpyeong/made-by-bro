-- ============================================================
-- ⚠️ 아카이브 (SSOT 아님) — ADR 0012 (2026-06-21, 채택)
--   스키마 SSOT 는 이제 apps/api/prisma/migrations/ 다.
--   이 파일은 baseline 참고용 아카이브이며, 직접 수정하지 말 것.
--   스키마 변경: apps/api/prisma/schema.prisma 수정 → prisma migrate dev.
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

-- ================================================================
-- [0006] 콜드스타트 캠페인 — 얼리버드 / 시딩 / 추천 / 활성화 (ADR 0006, G2~G5)
--   * 0006 = 오프라인 60명 시딩 → 활성화 → 후기·추천 → 외부 유료·CAC 측정.
--   * offers=진짜 희소성(선착순), referral=입소문 추적, events=활성화/CAC 원천.
-- ================================================================
CREATE TYPE offer_status    AS ENUM ('open', 'sold_out', 'closed');
CREATE TYPE cohort_status   AS ENUM ('active', 'completed', 'archived');
CREATE TYPE referral_status AS ENUM ('pending', 'signed_up', 'activated', 'converted', 'rewarded');
CREATE TYPE reward_kind     AS ENUM ('sub_extension', 'discount');     -- 비현금 보상만(ADR 0006 확정): 무료기간 연장 / 할인
CREATE TYPE reward_status   AS ENUM ('pending', 'granted', 'redeemed', 'revoked');

-- 21) offers — 선착순 한정 오퍼(얼리버드/기수제). course.html '37/100' 하드코딩을 실데이터화.
CREATE TABLE offers (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  course_id   BIGINT       REFERENCES courses(id) ON DELETE CASCADE,   -- NULL = 멤버십/전체 대상 오퍼
  name        VARCHAR(120) NOT NULL,                                   -- '얼리버드 1기'
  price       INTEGER      NOT NULL CHECK (price >= 0),                -- 얼리버드가(원)
  seat_limit  INTEGER      NOT NULL CHECK (seat_limit > 0),            -- 선착순 한도(예: 100)
  seat_taken  INTEGER      NOT NULL DEFAULT 0 CHECK (seat_taken >= 0), -- 결제확정 트랜잭션서 +1
  status      offer_status NOT NULL DEFAULT 'open',
  starts_at   TIMESTAMPTZ,
  ends_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
  CHECK (seat_taken <= seat_limit)
);
-- 잔여석 = seat_limit - seat_taken. 결제확정 시 UPDATE ... WHERE seat_taken < seat_limit 로 오버부킹 차단.

ALTER TABLE payments ADD COLUMN offer_id BIGINT REFERENCES offers(id) ON DELETE SET NULL; -- 어떤 오퍼로 결제했나(귀속)

-- 22) cohorts / 23) cohort_members — 시딩 코호트(레벨·학년·기수별 순차 개방, ADR 0006 확정: 코호트 분할)
CREATE TABLE cohorts (
  id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name       VARCHAR(120)  NOT NULL,                      -- '오프라인 시딩 1기(초등 고학년)'
  status     cohort_status NOT NULL DEFAULT 'active',
  notes      TEXT,
  started_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE TABLE cohort_members (
  id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  cohort_id  BIGINT      NOT NULL REFERENCES cohorts(id) ON DELETE CASCADE,
  user_id    BIGINT      NOT NULL REFERENCES users(id)   ON DELETE CASCADE,
  joined_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (cohort_id, user_id)
);
-- 60명 시딩 = cohort_members + subscriptions.source='seed'(billing_key NULL, period_end=+3개월) 조합.

-- 24) referral_codes / 25) referrals / 26) rewards — 추천 엔진(60명 각자 코드 → 입소문 추적)
CREATE TABLE referral_codes (
  id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id    BIGINT      NOT NULL REFERENCES users(id) ON DELETE CASCADE,  -- 코드 소유자(추천인)
  code       VARCHAR(40) NOT NULL UNIQUE,                                  -- 'BRO-XXXX'
  is_active  BOOLEAN     NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id)            -- 1인 1코드
);

CREATE TABLE referrals (
  id                   BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  code_id              BIGINT          NOT NULL REFERENCES referral_codes(id) ON DELETE CASCADE,
  referrer_user_id     BIGINT          NOT NULL REFERENCES users(id) ON DELETE CASCADE,  -- 추천한 사람
  referred_user_id     BIGINT          REFERENCES users(id) ON DELETE SET NULL,          -- 추천받아 가입한 사람(가입 전이면 NULL)
  status               referral_status NOT NULL DEFAULT 'pending',
  converted_payment_id BIGINT          REFERENCES payments(id) ON DELETE SET NULL,       -- 유료 전환 결제(CAC 귀속)
  created_at           TIMESTAMPTZ     NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ     NOT NULL DEFAULT now(),
  UNIQUE (referred_user_id)        -- 피추천자 1명은 1건만 귀속(중복/자기추천 방지)
);

CREATE TABLE rewards (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id     BIGINT        NOT NULL REFERENCES users(id) ON DELETE CASCADE,   -- 보상 수령자
  referral_id BIGINT        REFERENCES referrals(id) ON DELETE SET NULL,       -- 어떤 추천으로 발생했나
  kind        reward_kind   NOT NULL,                                          -- 비현금만: 연장/할인
  status      reward_status NOT NULL DEFAULT 'pending',
  amount      INTEGER       CHECK (amount IS NULL OR amount >= 0),             -- sub_extension=연장 일수 / discount=할인액(원)
  note        VARCHAR(200),
  granted_at  TIMESTAMPTZ,
  redeemed_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT now()
);
-- ADR 0006: 추천 보상은 현금 X → '무료기간 연장' 또는 '할인'만(학부모 정서 리스크 회피).

-- 27) events — 활성화/퍼널/CAC 측정 원천(Data 렌즈). 유연 로그.
CREATE TABLE events (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id     BIGINT       REFERENCES users(id) ON DELETE SET NULL,  -- 익명(가입 전)이면 NULL
  type        VARCHAR(40)  NOT NULL,   -- activation_first_lecture / referral_click / referral_signup / paid_conversion / review_submitted
  ref_table   VARCHAR(30),             -- 관련 엔터티(referral/offer/cohort/lecture)
  ref_id      BIGINT,
  props       JSONB        NOT NULL DEFAULT '{}',
  occurred_at TIMESTAMPTZ  NOT NULL DEFAULT now()
);
-- M1 활성화율 / M2 후기·추천 / M3 CAC 를 이 로그 + payments 귀속으로 산출.

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
-- [0006] 얼리버드/시딩/추천/활성화
CREATE INDEX idx_offers_course         ON offers (course_id) WHERE status = 'open';
CREATE INDEX idx_payments_offer        ON payments (offer_id);
CREATE INDEX idx_cohort_members_user   ON cohort_members (user_id);
CREATE INDEX idx_cohort_members_cohort ON cohort_members (cohort_id);
CREATE INDEX idx_referrals_referrer    ON referrals (referrer_user_id);
CREATE INDEX idx_referrals_status      ON referrals (status);
CREATE INDEX idx_rewards_user          ON rewards (user_id) WHERE status IN ('pending', 'granted');
CREATE INDEX idx_events_type_time      ON events (type, occurred_at);
CREATE INDEX idx_events_user           ON events (user_id);

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
CREATE TRIGGER trg_offers_updated     BEFORE UPDATE ON offers    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_referrals_updated  BEFORE UPDATE ON referrals FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ================================================================
-- 객체 설명 (COMMENT ON) — DB 카탈로그(pg_description)에 직접 기록
--   * psql \d+, pg_catalog, Prisma db pull(/// 주석)로 노출되어 스키마가 자기설명적이 됨.
--   * PostgreSQL은 enum '값' 단위 코멘트를 지원하지 않아, 값 의미는 타입 코멘트에 함께 기술.
--   * 공통 컬럼 규약(개별 코멘트 생략): id=기본키(BIGINT IDENTITY) /
--     created_at=생성 시각 / updated_at=수정 시각(set_updated_at 트리거 자동 갱신).
-- ================================================================

-- ENUM 타입 -------------------------------------------------------
COMMENT ON TYPE user_role           IS '사용자 권한: student=수강생 / instructor=강사 / admin=관리자';
COMMENT ON TYPE course_status       IS '코스 공개 상태: draft=작성중(비공개) / published=공개판매 / closed=판매종료';
COMMENT ON TYPE enrollment_status   IS '수강권 상태: active=수강중 / expired=기간만료 / cancelled=취소(환불 등)';
COMMENT ON TYPE payment_status      IS '결제 상태: pending=대기 / paid=완료 / failed=실패 / refunded=전액환불 / partially_refunded=부분환불';
COMMENT ON TYPE discount_type       IS '쿠폰 할인 방식: percent=정률(%) / fixed=정액(원)';
COMMENT ON TYPE quiz_type           IS '퀴즈 유형: inline=영상 중간 게이팅 / final=영상 종료 후 채점';
COMMENT ON TYPE refund_status       IS '환불 처리 상태: requested=요청 / approved=승인 / rejected=거부 / completed=완료';
COMMENT ON TYPE receipt_type        IS '증빙 유형: cash_receipt=현금영수증 / tax_invoice=세금계산서';
COMMENT ON TYPE receipt_status      IS '증빙 발급 상태: requested=요청 / issued=발급 / failed=실패 / cancelled=취소';
COMMENT ON TYPE billing_interval    IS '멤버십 청구 주기: month=월 / year=연 (ADR 0008)';
COMMENT ON TYPE subscription_status IS '구독 상태: active=유효 / past_due=결제실패 유예 / cancelled=해지예약·해지 / expired=만료 / paused=일시정지 (ADR 0008)';
COMMENT ON TYPE subscription_source IS '구독 발생 출처: paid=유료결제 / seed=ADR0006 60명 시딩 / comp=무상제공';
COMMENT ON TYPE offer_status        IS '선착순 한정 오퍼 상태: open=판매중 / sold_out=만석 / closed=종료 (ADR 0006)';
COMMENT ON TYPE cohort_status       IS '시딩 코호트 상태: active=진행중 / completed=완료 / archived=보관 (ADR 0006)';
COMMENT ON TYPE referral_status     IS '추천 단계: pending=대기 / signed_up=가입 / activated=활성화(첫 강의 수강) / converted=유료전환 / rewarded=보상지급 (ADR 0006)';
COMMENT ON TYPE reward_kind         IS '추천 보상 종류(비현금만, ADR 0006): sub_extension=무료기간 연장 / discount=할인';
COMMENT ON TYPE reward_status       IS '보상 상태: pending=대기 / granted=지급 / redeemed=사용 / revoked=회수';

-- 공통 함수 -------------------------------------------------------
COMMENT ON FUNCTION set_updated_at() IS 'BEFORE UPDATE 트리거 함수: NEW.updated_at 을 now()로 자동 갱신';

-- users -----------------------------------------------------------
COMMENT ON TABLE  users               IS '사용자 계정(수강생/강사/관리자). 이메일 또는 카카오 OAuth 로그인';
COMMENT ON COLUMN users.email         IS '로그인 이메일. CITEXT라 대소문자 무시 UNIQUE';
COMMENT ON COLUMN users.password      IS 'bcrypt/argon2 해시. 카카오 전용 계정은 NULL';
COMMENT ON COLUMN users.name          IS '표시 이름';
COMMENT ON COLUMN users.role          IS '권한(user_role)';
COMMENT ON COLUMN users.kakao_id      IS '카카오 OAuth 식별자(소셜 가입 시)';
COMMENT ON COLUMN users.profile_image IS '프로필 이미지 URL';

-- categories ------------------------------------------------------
COMMENT ON TABLE  categories      IS '코스 분류(카테고리)';
COMMENT ON COLUMN categories.name IS '분류명';
COMMENT ON COLUMN categories.slug IS 'URL 슬러그(UNIQUE)';

-- courses ---------------------------------------------------------
COMMENT ON TABLE  courses               IS '강의(코스). Course → Section → Lecture 계층의 최상위';
COMMENT ON COLUMN courses.category_id   IS '분류(FK). 분류 삭제 시 NULL';
COMMENT ON COLUMN courses.instructor_id IS '담당 강사(FK users). 강사 삭제 시 NULL';
COMMENT ON COLUMN courses.title         IS '코스 제목';
COMMENT ON COLUMN courses.description   IS '코스 소개';
COMMENT ON COLUMN courses.thumbnail_url IS '썸네일 이미지 URL';
COMMENT ON COLUMN courses.price         IS '단건 구매가(KRW 정수, 원). 0=무료';
COMMENT ON COLUMN courses.status        IS '공개 상태(course_status)';

-- sections --------------------------------------------------------
COMMENT ON TABLE  sections          IS '코스 내 섹션(챕터). 코스 삭제 시 CASCADE';
COMMENT ON COLUMN sections.course_id IS '소속 코스(FK)';
COMMENT ON COLUMN sections.title     IS '섹션 제목';
COMMENT ON COLUMN sections.order_no  IS '코스 내 정렬 순서(코스별 UNIQUE)';

-- lectures --------------------------------------------------------
COMMENT ON TABLE  lectures                      IS '개별 강의(영상). 섹션 삭제 시 CASCADE';
COMMENT ON COLUMN lectures.section_id           IS '소속 섹션(FK)';
COMMENT ON COLUMN lectures.title                IS '강의 제목';
COMMENT ON COLUMN lectures.video_uid            IS 'Cloudflare Stream/Mux 자산 UID. 외부 URL 직접 미노출, 재생 시 Signed URL 발급';
COMMENT ON COLUMN lectures.duration             IS '영상 길이(초)';
COMMENT ON COLUMN lectures.order_no             IS '섹션 내 정렬 순서(섹션별 UNIQUE)';
COMMENT ON COLUMN lectures.is_preview           IS '미리보기(무료 공개) 강의 여부';
COMMENT ON COLUMN lectures.require_full_watch   IS '완청 필수 여부(강사 설정)';
COMMENT ON COLUMN lectures.completion_threshold IS '완청 인정 비율(%). covered_seconds/duration 이 이상이면 완료';
COMMENT ON COLUMN lectures.disable_seek         IS '최초 수강 시 빨리감기 금지(복습 시 해제)';

-- attachments -----------------------------------------------------
COMMENT ON TABLE  attachments            IS '강의 첨부자료(PDF 등). 다운로드는 Signed URL 발급';
COMMENT ON COLUMN attachments.lecture_id IS '소속 강의(FK)';
COMMENT ON COLUMN attachments.file_url   IS 'S3 객체키(직접 노출 금지)';
COMMENT ON COLUMN attachments.filename   IS '원본 파일명';
COMMENT ON COLUMN attachments.size_bytes IS '파일 크기(byte)';

-- quizzes ---------------------------------------------------------
COMMENT ON TABLE  quizzes                 IS '퀴즈: inline=영상 중간 게이팅 / final=종료 후 채점';
COMMENT ON COLUMN quizzes.lecture_id      IS '소속 강의(FK)';
COMMENT ON COLUMN quizzes.quiz_type       IS '유형(quiz_type)';
COMMENT ON COLUMN quizzes.position_sec    IS 'inline 게이팅 시점(초). final 은 NULL';
COMMENT ON COLUMN quizzes.question        IS '문제 본문';
COMMENT ON COLUMN quizzes.options         IS '보기 목록 JSONB: ["보기1","보기2",...]';
COMMENT ON COLUMN quizzes.answer          IS '정답 인덱스/값 JSONB(단일·복수 지원)';
COMMENT ON COLUMN quizzes.require_correct IS 'inline: 정답이어야 영상 진행';
COMMENT ON COLUMN quizzes.points          IS 'final 채점 배점';
COMMENT ON COLUMN quizzes.order_no        IS '정렬 순서';

-- quiz_attempts ---------------------------------------------------
COMMENT ON TABLE  quiz_attempts            IS '퀴즈 응답/채점 이력';
COMMENT ON COLUMN quiz_attempts.user_id    IS '응답자(FK users)';
COMMENT ON COLUMN quiz_attempts.quiz_id    IS '대상 퀴즈(FK)';
COMMENT ON COLUMN quiz_attempts.selected   IS '제출한 답 JSONB';
COMMENT ON COLUMN quiz_attempts.is_correct IS '정답 여부';
COMMENT ON COLUMN quiz_attempts.score      IS '획득 점수(final)';

-- coupons ---------------------------------------------------------
COMMENT ON TABLE  coupons                IS '할인 쿠폰';
COMMENT ON COLUMN coupons.code           IS '쿠폰 코드(UNIQUE)';
COMMENT ON COLUMN coupons.discount_type  IS '할인 방식(discount_type)';
COMMENT ON COLUMN coupons.discount_value IS 'percent: 1~100 / fixed: KRW(원)';
COMMENT ON COLUMN coupons.min_amount     IS '최소 결제 금액(원)';
COMMENT ON COLUMN coupons.max_uses       IS '총 사용 한도. NULL=무제한';
COMMENT ON COLUMN coupons.used_count     IS '누적 사용 횟수';
COMMENT ON COLUMN coupons.valid_until    IS '유효 만료 시각. NULL=무기한';

-- plans -----------------------------------------------------------
COMMENT ON TABLE  plans                IS '멤버십(구독) 요금제 정의. 단건가는 courses.price 사용 (ADR 0008)';
COMMENT ON COLUMN plans.code           IS '플랜 코드(UNIQUE): membership_monthly / membership_annual';
COMMENT ON COLUMN plans.name           IS '플랜 표시명';
COMMENT ON COLUMN plans.price          IS '구독료(KRW 정수, 원). 가격은 ADR 0005 잠정(월19,900/연179,000)';
COMMENT ON COLUMN plans.billing_period IS '청구 주기(billing_interval)';
COMMENT ON COLUMN plans.period_count   IS '주기 배수(1=매월/매년)';
COMMENT ON COLUMN plans.trial_days     IS '무료체험 일수(0=없음)';
COMMENT ON COLUMN plans.is_active      IS '판매중 여부. false=판매중단(기존 구독은 유지)';

-- subscriptions ---------------------------------------------------
COMMENT ON TABLE  subscriptions                      IS '구독 상태 — 멤버십 접근 판정의 원천. 1유저 동시 활성 1개(부분 UNIQUE) (ADR 0008)';
COMMENT ON COLUMN subscriptions.user_id              IS '구독자(FK users)';
COMMENT ON COLUMN subscriptions.plan_id              IS '구독 플랜(FK plans). 플랜 삭제 RESTRICT';
COMMENT ON COLUMN subscriptions.status               IS '구독 상태(subscription_status)';
COMMENT ON COLUMN subscriptions.source               IS '발생 출처(subscription_source). seed=0006 시딩';
COMMENT ON COLUMN subscriptions.billing_key          IS '토스 빌링키(자동결제 토큰). 시드/무상은 NULL';
COMMENT ON COLUMN subscriptions.current_period_start IS '현재 청구주기 시작';
COMMENT ON COLUMN subscriptions.current_period_end   IS '현재 주기 종료=이 시점까지 접근 허용. 갱신 배치 대상';
COMMENT ON COLUMN subscriptions.cancel_at_period_end IS '해지 예약(기간말 종료, 즉시 차단 아님)';
COMMENT ON COLUMN subscriptions.cancelled_at         IS '실제 해지 처리 시각';

-- payments --------------------------------------------------------
COMMENT ON TABLE  payments                 IS '단건·구독 통합 결제 원장. 단건=course_id / 구독=subscription_id, 둘 중 하나 필수(CHECK) (ADR 0008)';
COMMENT ON COLUMN payments.user_id         IS '결제자(FK users). 삭제 RESTRICT';
COMMENT ON COLUMN payments.course_id       IS '단건 구매 대상 코스. 구독 결제면 NULL';
COMMENT ON COLUMN payments.subscription_id IS '구독 청구 1회분. 단건이면 NULL';
COMMENT ON COLUMN payments.coupon_id       IS '적용 쿠폰(FK). 미사용 NULL';
COMMENT ON COLUMN payments.amount          IS '실제 결제 금액(할인 후, 원)';
COMMENT ON COLUMN payments.pg_provider     IS 'PG사: toss / portone ...';
COMMENT ON COLUMN payments.pg_tid          IS 'PG 거래 고유키(멱등/환불 조회). (pg_provider,pg_tid) UNIQUE';
COMMENT ON COLUMN payments.status          IS '결제 상태(payment_status)';
COMMENT ON COLUMN payments.refund_amount   IS '누적 환불 금액(원)';
COMMENT ON COLUMN payments.paid_at         IS '결제 완료 시각';
COMMENT ON COLUMN payments.refunded_at     IS '환불 처리 시각';
COMMENT ON COLUMN payments.offer_id        IS '결제에 적용된 한정 오퍼(FK offers, ADR 0006). 미적용 NULL';

-- coupon_redemptions ----------------------------------------------
COMMENT ON TABLE  coupon_redemptions            IS '쿠폰 사용 이력. (coupon_id,user_id) UNIQUE=1인 1회 중복사용 방지';
COMMENT ON COLUMN coupon_redemptions.coupon_id  IS '사용 쿠폰(FK)';
COMMENT ON COLUMN coupon_redemptions.user_id    IS '사용자(FK)';
COMMENT ON COLUMN coupon_redemptions.payment_id IS '사용된 결제(FK)';

-- enrollments -----------------------------------------------------
COMMENT ON TABLE  enrollments              IS '수강권: 결제→권한 부여. (user_id,course_id) UNIQUE=중복 수강 방지';
COMMENT ON COLUMN enrollments.user_id      IS '수강자(FK users)';
COMMENT ON COLUMN enrollments.course_id    IS '대상 코스(FK)';
COMMENT ON COLUMN enrollments.payment_id   IS '결제 출처(FK payments). 결제 삭제 시 NULL';
COMMENT ON COLUMN enrollments.status       IS '수강권 상태(enrollment_status)';
COMMENT ON COLUMN enrollments.purchased_at IS '수강권 취득 시각';
COMMENT ON COLUMN enrollments.expires_at   IS '수강 만료 시각. NULL=무제한';

-- progress --------------------------------------------------------
COMMENT ON TABLE  progress                   IS '강의별 진도/이어보기/완청 검증. (user_id,lecture_id) UNIQUE';
COMMENT ON COLUMN progress.user_id           IS '수강자(FK users)';
COMMENT ON COLUMN progress.lecture_id        IS '대상 강의(FK)';
COMMENT ON COLUMN progress.watched_seconds   IS '누적 시청 시간(초)';
COMMENT ON COLUMN progress.last_position     IS '이어보기 지점(초)';
COMMENT ON COLUMN progress.covered_seconds   IS '실제 재생된 고유 구간 합(초). 완청 판정 분자';
COMMENT ON COLUMN progress.watched_intervals IS '재생 구간 JSONB [[start,end],...]. 스크럽 가짜완료 방지용 union';
COMMENT ON COLUMN progress.max_position      IS '최대 시청 지점(초). 빨리감기 제한 기준';
COMMENT ON COLUMN progress.completed         IS '완청 임계 도달 여부';
COMMENT ON COLUMN progress.completed_at      IS '완청 시각';

-- bookmarks -------------------------------------------------------
COMMENT ON TABLE  bookmarks              IS '강의 내 북마크(시점 메모)';
COMMENT ON COLUMN bookmarks.user_id      IS '소유자(FK users)';
COMMENT ON COLUMN bookmarks.lecture_id   IS '대상 강의(FK)';
COMMENT ON COLUMN bookmarks.position_sec IS '북마크 시점(초)';
COMMENT ON COLUMN bookmarks.label        IS '메모 라벨';

-- reviews ---------------------------------------------------------
COMMENT ON TABLE  reviews           IS '수강평. (user_id,course_id) UNIQUE=1인 1코스 1리뷰';
COMMENT ON COLUMN reviews.user_id   IS '작성자(FK users)';
COMMENT ON COLUMN reviews.course_id IS '대상 코스(FK)';
COMMENT ON COLUMN reviews.rating    IS '별점 1~5';
COMMENT ON COLUMN reviews.comment   IS '후기 본문';

-- qna -------------------------------------------------------------
COMMENT ON TABLE  qna             IS '질문게시판. parent_id 로 질문-답글 트리';
COMMENT ON COLUMN qna.user_id     IS '작성자(FK users)';
COMMENT ON COLUMN qna.course_id   IS '대상 코스(FK)';
COMMENT ON COLUMN qna.lecture_id  IS '특정 강의 관련 질문(optional)';
COMMENT ON COLUMN qna.parent_id   IS 'NULL=질문 / 값=해당 질문의 답글';
COMMENT ON COLUMN qna.title       IS '질문 제목';
COMMENT ON COLUMN qna.content     IS '본문';
COMMENT ON COLUMN qna.is_answered IS '답변 완료 여부';

-- refunds ---------------------------------------------------------
COMMENT ON TABLE  refunds               IS '수강률 기반 비례 환불(학원/평생교육법 의무)';
COMMENT ON COLUMN refunds.payment_id    IS '환불 대상 결제(FK). 삭제 RESTRICT';
COMMENT ON COLUMN refunds.user_id       IS '환불 요청자(FK users)';
COMMENT ON COLUMN refunds.reason        IS '환불 사유';
COMMENT ON COLUMN refunds.progress_rate IS '환불 산정 시 진도율(%)';
COMMENT ON COLUMN refunds.refund_amount IS '법정 비례 환불액(원)';
COMMENT ON COLUMN refunds.status        IS '처리 상태(refund_status)';
COMMENT ON COLUMN refunds.requested_at  IS '환불 요청 시각';
COMMENT ON COLUMN refunds.processed_at  IS '환불 처리 완료 시각';

-- receipts --------------------------------------------------------
COMMENT ON TABLE  receipts              IS '현금영수증/세금계산서(소득세법 발급)';
COMMENT ON COLUMN receipts.payment_id   IS '대상 결제(FK)';
COMMENT ON COLUMN receipts.receipt_type IS '증빙 유형(receipt_type)';
COMMENT ON COLUMN receipts.identifier   IS '휴대폰번호(현금영수증)/사업자번호(세금계산서)';
COMMENT ON COLUMN receipts.receipt_no   IS '발급 번호(국세청/PG)';
COMMENT ON COLUMN receipts.status       IS '발급 상태(receipt_status)';
COMMENT ON COLUMN receipts.issued_at    IS '발급 완료 시각';

-- certificates ----------------------------------------------------
COMMENT ON TABLE  certificates           IS '수료증. (user_id,course_id) UNIQUE=코스당 1회';
COMMENT ON COLUMN certificates.user_id   IS '수료자(FK users)';
COMMENT ON COLUMN certificates.course_id IS '대상 코스(FK)';
COMMENT ON COLUMN certificates.cert_no   IS '수료번호(UNIQUE)';
COMMENT ON COLUMN certificates.pdf_url   IS '발급 PDF URL(S3)';
COMMENT ON COLUMN certificates.issued_at IS '발급 시각';

-- user_sessions ---------------------------------------------------
COMMENT ON TABLE  user_sessions              IS '로그인 세션(동시접속/기기 제한, 계정공유 방지)';
COMMENT ON COLUMN user_sessions.user_id      IS '세션 소유자(FK users)';
COMMENT ON COLUMN user_sessions.refresh_hash IS 'refresh token 해시(회전/폐기용)';
COMMENT ON COLUMN user_sessions.device       IS 'UA/기기 식별 문자열';
COMMENT ON COLUMN user_sessions.ip           IS '접속 IP';
COMMENT ON COLUMN user_sessions.last_seen_at IS '마지막 활동 시각';
COMMENT ON COLUMN user_sessions.expires_at   IS '세션 만료 시각';

-- notifications ---------------------------------------------------
COMMENT ON TABLE  notifications         IS '인앱 알림';
COMMENT ON COLUMN notifications.user_id IS '수신자(FK users)';
COMMENT ON COLUMN notifications.type    IS '알림 종류: payment/qna_answer/expiry/new_lecture/system';
COMMENT ON COLUMN notifications.title   IS '알림 제목';
COMMENT ON COLUMN notifications.body    IS '알림 본문';
COMMENT ON COLUMN notifications.link    IS '클릭 이동 링크';
COMMENT ON COLUMN notifications.is_read IS '읽음 여부';

-- announcements ---------------------------------------------------
COMMENT ON TABLE  announcements           IS '공지. course_id NULL=전체 공지 / 값=코스 공지';
COMMENT ON COLUMN announcements.course_id IS '대상 코스(FK). NULL=전체';
COMMENT ON COLUMN announcements.title     IS '공지 제목';
COMMENT ON COLUMN announcements.content   IS '공지 본문';
COMMENT ON COLUMN announcements.pinned    IS '상단 고정 여부';

-- offers (ADR 0006) -----------------------------------------------
COMMENT ON TABLE  offers            IS '선착순 한정 오퍼(얼리버드/기수제). 잔여석=seat_limit-seat_taken. course.html ''37/100'' 실데이터화 (ADR 0006)';
COMMENT ON COLUMN offers.course_id  IS '대상 코스(FK). NULL=멤버십/전체 대상 오퍼';
COMMENT ON COLUMN offers.name       IS '오퍼명(예: 얼리버드 1기)';
COMMENT ON COLUMN offers.price      IS '얼리버드가(원)';
COMMENT ON COLUMN offers.seat_limit IS '선착순 한도(예: 100)';
COMMENT ON COLUMN offers.seat_taken IS '점유 좌석 수. 결제확정 트랜잭션서 +1(오버부킹 CHECK 차단)';
COMMENT ON COLUMN offers.status     IS '오퍼 상태(offer_status). 만석→sold_out';
COMMENT ON COLUMN offers.starts_at  IS '판매 시작 시각';
COMMENT ON COLUMN offers.ends_at    IS '판매 종료 시각';

-- cohorts / cohort_members (ADR 0006) -----------------------------
COMMENT ON TABLE  cohorts                  IS '시딩 코호트(레벨·학년·기수별 순차 개방) (ADR 0006)';
COMMENT ON COLUMN cohorts.name             IS '코호트명(예: 오프라인 시딩 1기(초등 고학년))';
COMMENT ON COLUMN cohorts.status           IS '코호트 상태(cohort_status)';
COMMENT ON COLUMN cohorts.notes            IS '운영 메모';
COMMENT ON COLUMN cohorts.started_at       IS '개방 시작 시각';
COMMENT ON TABLE  cohort_members           IS '코호트 소속 멤버. (cohort_id,user_id) UNIQUE. 60명 시딩=members + subscriptions.source=seed';
COMMENT ON COLUMN cohort_members.cohort_id IS '소속 코호트(FK)';
COMMENT ON COLUMN cohort_members.user_id   IS '멤버(FK users)';
COMMENT ON COLUMN cohort_members.joined_at IS '합류 시각';

-- referral_codes / referrals / rewards (ADR 0006) -----------------
COMMENT ON TABLE  referral_codes           IS '추천 코드(1인 1코드, user_id UNIQUE). 입소문 추적 (ADR 0006)';
COMMENT ON COLUMN referral_codes.user_id   IS '코드 소유자=추천인(FK users)';
COMMENT ON COLUMN referral_codes.code      IS '추천 코드(UNIQUE, 예: BRO-XXXX)';
COMMENT ON COLUMN referral_codes.is_active IS '코드 활성 여부';

COMMENT ON TABLE  referrals                      IS '추천 귀속. referred_user_id UNIQUE=피추천자 1건만(중복/자기추천 차단) (ADR 0006)';
COMMENT ON COLUMN referrals.code_id              IS '사용된 추천 코드(FK referral_codes)';
COMMENT ON COLUMN referrals.referrer_user_id     IS '추천한 사람(FK users)';
COMMENT ON COLUMN referrals.referred_user_id     IS '추천받아 가입한 사람(FK users). 가입 전이면 NULL';
COMMENT ON COLUMN referrals.status               IS '추천 단계(referral_status)';
COMMENT ON COLUMN referrals.converted_payment_id IS '유료 전환 결제(FK payments). CAC 귀속 기준';

COMMENT ON TABLE  rewards             IS '추천 보상(비현금: 연장/할인). ADR 0006: 현금 보상 금지(학부모 정서 리스크)';
COMMENT ON COLUMN rewards.user_id     IS '보상 수령자(FK users)';
COMMENT ON COLUMN rewards.referral_id IS '보상 발생 추천(FK referrals)';
COMMENT ON COLUMN rewards.kind        IS '보상 종류(reward_kind)';
COMMENT ON COLUMN rewards.status      IS '보상 상태(reward_status)';
COMMENT ON COLUMN rewards.amount      IS 'sub_extension=연장 일수 / discount=할인액(원). NULL 허용';
COMMENT ON COLUMN rewards.note        IS '보상 메모';
COMMENT ON COLUMN rewards.granted_at  IS '지급 시각';
COMMENT ON COLUMN rewards.redeemed_at IS '사용(적용) 시각';

-- events (ADR 0006) -----------------------------------------------
COMMENT ON TABLE  events             IS '활성화/퍼널/CAC 측정 원천(Data 렌즈). 유연 이벤트 로그 (ADR 0006)';
COMMENT ON COLUMN events.user_id     IS '주체(FK users). 익명(가입 전)이면 NULL';
COMMENT ON COLUMN events.type        IS '이벤트 종류: activation_first_lecture/referral_click/referral_signup/paid_conversion/review_submitted ...';
COMMENT ON COLUMN events.ref_table   IS '관련 엔터티 종류(referral/offer/cohort/lecture)';
COMMENT ON COLUMN events.ref_id      IS '관련 엔터티 id';
COMMENT ON COLUMN events.props       IS '부가 속성 JSONB';
COMMENT ON COLUMN events.occurred_at IS '이벤트 발생 시각';

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
--  * [콜드스타트 캠페인 — ADR 0006]
--    - 얼리버드 잔여석: offers.seat_limit - seat_taken. 결제확정 트랜잭션서
--        UPDATE offers SET seat_taken=seat_taken+1 WHERE id=? AND seat_taken<seat_limit (영향행 0이면 만석→거부).
--        만석 시 status='sold_out'으로 전환, 다음 기수는 새 offers row. (course.html '37/100' 하드코딩 대체)
--    - 60명 시딩: cohort_members 등록 + subscriptions(source='seed', billing_key NULL, period_end=가입+3개월).
--    - 추천: referral_codes(1인1코드) → referrals(referred_user_id UNIQUE=중복귀속 차단) →
--        유료 전환 시 referrals.converted_payment_id 로 CAC 귀속. 보상은 rewards(비현금: sub_extension/discount).
--    - 측정(Data): events(type별) + payments 귀속으로 M1 활성화율 / M2 후기·추천 / M3 CAC 산출.
-- ================================================================
