-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "citext";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- CreateEnum
CREATE TYPE "billing_interval" AS ENUM ('month', 'year');

-- CreateEnum
CREATE TYPE "cohort_status" AS ENUM ('active', 'completed', 'archived');

-- CreateEnum
CREATE TYPE "course_status" AS ENUM ('draft', 'published', 'closed');

-- CreateEnum
CREATE TYPE "discount_type" AS ENUM ('percent', 'fixed');

-- CreateEnum
CREATE TYPE "enrollment_status" AS ENUM ('active', 'expired', 'cancelled');

-- CreateEnum
CREATE TYPE "offer_status" AS ENUM ('open', 'sold_out', 'closed');

-- CreateEnum
CREATE TYPE "payment_status" AS ENUM ('pending', 'paid', 'failed', 'refunded', 'partially_refunded');

-- CreateEnum
CREATE TYPE "quiz_type" AS ENUM ('inline', 'final');

-- CreateEnum
CREATE TYPE "receipt_status" AS ENUM ('requested', 'issued', 'failed', 'cancelled');

-- CreateEnum
CREATE TYPE "receipt_type" AS ENUM ('cash_receipt', 'tax_invoice');

-- CreateEnum
CREATE TYPE "referral_status" AS ENUM ('pending', 'signed_up', 'activated', 'converted', 'rewarded');

-- CreateEnum
CREATE TYPE "refund_status" AS ENUM ('requested', 'approved', 'rejected', 'completed');

-- CreateEnum
CREATE TYPE "reward_kind" AS ENUM ('sub_extension', 'discount');

-- CreateEnum
CREATE TYPE "reward_status" AS ENUM ('pending', 'granted', 'redeemed', 'revoked');

-- CreateEnum
CREATE TYPE "subscription_source" AS ENUM ('paid', 'seed', 'comp');

-- CreateEnum
CREATE TYPE "subscription_status" AS ENUM ('active', 'past_due', 'cancelled', 'expired', 'paused');

-- CreateEnum
CREATE TYPE "user_role" AS ENUM ('student', 'instructor', 'admin');

-- CreateTable
CREATE TABLE "announcements" (
    "id" BIGSERIAL NOT NULL,
    "course_id" BIGINT,
    "title" VARCHAR(200) NOT NULL,
    "content" TEXT NOT NULL,
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "announcements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attachments" (
    "id" BIGSERIAL NOT NULL,
    "lecture_id" BIGINT NOT NULL,
    "file_url" TEXT NOT NULL,
    "filename" VARCHAR(255) NOT NULL,
    "size_bytes" BIGINT NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bookmarks" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "lecture_id" BIGINT NOT NULL,
    "position_sec" INTEGER NOT NULL,
    "label" VARCHAR(200),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bookmarks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" BIGSERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "slug" VARCHAR(120) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "certificates" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "course_id" BIGINT NOT NULL,
    "cert_no" VARCHAR(64) NOT NULL,
    "pdf_url" TEXT,
    "issued_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "certificates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cohort_members" (
    "id" BIGSERIAL NOT NULL,
    "cohort_id" BIGINT NOT NULL,
    "user_id" BIGINT NOT NULL,
    "joined_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cohort_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cohorts" (
    "id" BIGSERIAL NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "status" "cohort_status" NOT NULL DEFAULT 'active',
    "notes" TEXT,
    "started_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cohorts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coupon_redemptions" (
    "id" BIGSERIAL NOT NULL,
    "coupon_id" BIGINT NOT NULL,
    "user_id" BIGINT NOT NULL,
    "payment_id" BIGINT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "coupon_redemptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coupons" (
    "id" BIGSERIAL NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "discount_type" "discount_type" NOT NULL,
    "discount_value" INTEGER NOT NULL,
    "min_amount" INTEGER NOT NULL DEFAULT 0,
    "max_uses" INTEGER,
    "used_count" INTEGER NOT NULL DEFAULT 0,
    "valid_until" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "coupons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "courses" (
    "id" BIGSERIAL NOT NULL,
    "category_id" BIGINT,
    "instructor_id" BIGINT,
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "thumbnail_url" TEXT,
    "price" INTEGER NOT NULL DEFAULT 0,
    "status" "course_status" NOT NULL DEFAULT 'draft',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enrollments" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "course_id" BIGINT NOT NULL,
    "payment_id" BIGINT,
    "status" "enrollment_status" NOT NULL DEFAULT 'active',
    "purchased_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMPTZ(6),

    CONSTRAINT "enrollments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "events" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT,
    "type" VARCHAR(40) NOT NULL,
    "ref_table" VARCHAR(30),
    "ref_id" BIGINT,
    "props" JSONB NOT NULL DEFAULT '{}',
    "occurred_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lectures" (
    "id" BIGSERIAL NOT NULL,
    "section_id" BIGINT NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "video_uid" VARCHAR(128),
    "duration" INTEGER NOT NULL DEFAULT 0,
    "order_no" INTEGER NOT NULL DEFAULT 0,
    "is_preview" BOOLEAN NOT NULL DEFAULT false,
    "require_full_watch" BOOLEAN NOT NULL DEFAULT false,
    "completion_threshold" SMALLINT NOT NULL DEFAULT 90,
    "disable_seek" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lectures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "type" VARCHAR(30) NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "body" TEXT,
    "link" TEXT,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "offers" (
    "id" BIGSERIAL NOT NULL,
    "course_id" BIGINT,
    "name" VARCHAR(120) NOT NULL,
    "price" INTEGER NOT NULL,
    "seat_limit" INTEGER NOT NULL,
    "seat_taken" INTEGER NOT NULL DEFAULT 0,
    "status" "offer_status" NOT NULL DEFAULT 'open',
    "starts_at" TIMESTAMPTZ(6),
    "ends_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "offers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "course_id" BIGINT,
    "subscription_id" BIGINT,
    "coupon_id" BIGINT,
    "amount" INTEGER NOT NULL,
    "pg_provider" VARCHAR(30) NOT NULL DEFAULT 'toss',
    "pg_tid" VARCHAR(128),
    "status" "payment_status" NOT NULL DEFAULT 'pending',
    "refund_amount" INTEGER NOT NULL DEFAULT 0,
    "paid_at" TIMESTAMPTZ(6),
    "refunded_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "offer_id" BIGINT,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plans" (
    "id" BIGSERIAL NOT NULL,
    "code" VARCHAR(40) NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "price" INTEGER NOT NULL,
    "billing_period" "billing_interval" NOT NULL,
    "period_count" SMALLINT NOT NULL DEFAULT 1,
    "trial_days" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "progress" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "lecture_id" BIGINT NOT NULL,
    "watched_seconds" INTEGER NOT NULL DEFAULT 0,
    "last_position" INTEGER NOT NULL DEFAULT 0,
    "covered_seconds" INTEGER NOT NULL DEFAULT 0,
    "watched_intervals" JSONB NOT NULL DEFAULT '[]',
    "max_position" INTEGER NOT NULL DEFAULT 0,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completed_at" TIMESTAMPTZ(6),
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "qna" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "course_id" BIGINT NOT NULL,
    "lecture_id" BIGINT,
    "parent_id" BIGINT,
    "title" VARCHAR(200),
    "content" TEXT NOT NULL,
    "is_answered" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "qna_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quiz_attempts" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "quiz_id" BIGINT NOT NULL,
    "selected" JSONB NOT NULL,
    "is_correct" BOOLEAN NOT NULL,
    "score" SMALLINT NOT NULL DEFAULT 0,
    "attempted_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quiz_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quizzes" (
    "id" BIGSERIAL NOT NULL,
    "lecture_id" BIGINT NOT NULL,
    "quiz_type" "quiz_type" NOT NULL DEFAULT 'inline',
    "position_sec" INTEGER,
    "question" TEXT NOT NULL,
    "options" JSONB NOT NULL,
    "answer" JSONB NOT NULL,
    "require_correct" BOOLEAN NOT NULL DEFAULT true,
    "points" SMALLINT NOT NULL DEFAULT 0,
    "order_no" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quizzes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "receipts" (
    "id" BIGSERIAL NOT NULL,
    "payment_id" BIGINT NOT NULL,
    "receipt_type" "receipt_type" NOT NULL,
    "identifier" VARCHAR(50) NOT NULL,
    "receipt_no" VARCHAR(64),
    "status" "receipt_status" NOT NULL DEFAULT 'requested',
    "issued_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "receipts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "referral_codes" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "code" VARCHAR(40) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "referral_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "referrals" (
    "id" BIGSERIAL NOT NULL,
    "code_id" BIGINT NOT NULL,
    "referrer_user_id" BIGINT NOT NULL,
    "referred_user_id" BIGINT,
    "status" "referral_status" NOT NULL DEFAULT 'pending',
    "converted_payment_id" BIGINT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "referrals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refunds" (
    "id" BIGSERIAL NOT NULL,
    "payment_id" BIGINT NOT NULL,
    "user_id" BIGINT NOT NULL,
    "reason" TEXT,
    "progress_rate" SMALLINT NOT NULL DEFAULT 0,
    "refund_amount" INTEGER NOT NULL,
    "status" "refund_status" NOT NULL DEFAULT 'requested',
    "requested_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed_at" TIMESTAMPTZ(6),

    CONSTRAINT "refunds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reviews" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "course_id" BIGINT NOT NULL,
    "rating" SMALLINT NOT NULL,
    "comment" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rewards" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "referral_id" BIGINT,
    "kind" "reward_kind" NOT NULL,
    "status" "reward_status" NOT NULL DEFAULT 'pending',
    "amount" INTEGER,
    "note" VARCHAR(200),
    "granted_at" TIMESTAMPTZ(6),
    "redeemed_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rewards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sections" (
    "id" BIGSERIAL NOT NULL,
    "course_id" BIGINT NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "order_no" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "plan_id" BIGINT NOT NULL,
    "status" "subscription_status" NOT NULL DEFAULT 'active',
    "source" "subscription_source" NOT NULL DEFAULT 'paid',
    "billing_key" VARCHAR(255),
    "current_period_start" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "current_period_end" TIMESTAMPTZ(6) NOT NULL,
    "cancel_at_period_end" BOOLEAN NOT NULL DEFAULT false,
    "cancelled_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_sessions" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT NOT NULL,
    "refresh_hash" VARCHAR(255) NOT NULL,
    "device" VARCHAR(200),
    "ip" VARCHAR(64),
    "last_seen_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "user_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" BIGSERIAL NOT NULL,
    "email" CITEXT NOT NULL,
    "password" VARCHAR(255),
    "name" VARCHAR(100) NOT NULL,
    "role" "user_role" NOT NULL DEFAULT 'student',
    "kakao_id" VARCHAR(64),
    "profile_image" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_announcements_course" ON "announcements"("course_id");

-- CreateIndex
CREATE INDEX "idx_attachments_lecture" ON "attachments"("lecture_id");

-- CreateIndex
CREATE INDEX "idx_bookmarks_user_lec" ON "bookmarks"("user_id", "lecture_id");

-- CreateIndex
CREATE UNIQUE INDEX "categories_slug_key" ON "categories"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "certificates_cert_no_key" ON "certificates"("cert_no");

-- CreateIndex
CREATE INDEX "idx_certificates_user" ON "certificates"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "certificates_user_id_course_id_key" ON "certificates"("user_id", "course_id");

-- CreateIndex
CREATE INDEX "idx_cohort_members_cohort" ON "cohort_members"("cohort_id");

-- CreateIndex
CREATE INDEX "idx_cohort_members_user" ON "cohort_members"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "cohort_members_cohort_id_user_id_key" ON "cohort_members"("cohort_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "coupon_redemptions_coupon_id_user_id_key" ON "coupon_redemptions"("coupon_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "coupons_code_key" ON "coupons"("code");

-- CreateIndex
CREATE INDEX "idx_courses_status" ON "courses"("status");

-- CreateIndex
CREATE INDEX "idx_courses_title_trgm" ON "courses" USING GIN ("title" gin_trgm_ops);

-- CreateIndex
CREATE INDEX "idx_enrollments_course" ON "enrollments"("course_id");

-- CreateIndex
CREATE INDEX "idx_enrollments_user" ON "enrollments"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "enrollments_user_id_course_id_key" ON "enrollments"("user_id", "course_id");

-- CreateIndex
CREATE INDEX "idx_events_type_time" ON "events"("type", "occurred_at");

-- CreateIndex
CREATE INDEX "idx_events_user" ON "events"("user_id");

-- CreateIndex
CREATE INDEX "idx_lectures_section" ON "lectures"("section_id");

-- CreateIndex
CREATE UNIQUE INDEX "lectures_section_id_order_no_key" ON "lectures"("section_id", "order_no");

-- CreateIndex
CREATE INDEX "idx_payments_offer" ON "payments"("offer_id");

-- CreateIndex
CREATE INDEX "idx_payments_status" ON "payments"("status");

-- CreateIndex
CREATE INDEX "idx_payments_subscription" ON "payments"("subscription_id");

-- CreateIndex
CREATE INDEX "idx_payments_user" ON "payments"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "payments_pg_provider_pg_tid_key" ON "payments"("pg_provider", "pg_tid");

-- CreateIndex
CREATE UNIQUE INDEX "plans_code_key" ON "plans"("code");

-- CreateIndex
CREATE INDEX "idx_progress_user" ON "progress"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "progress_user_id_lecture_id_key" ON "progress"("user_id", "lecture_id");

-- CreateIndex
CREATE INDEX "idx_qna_course" ON "qna"("course_id");

-- CreateIndex
CREATE INDEX "idx_qna_parent" ON "qna"("parent_id");

-- CreateIndex
CREATE INDEX "idx_quiz_attempts_quiz" ON "quiz_attempts"("quiz_id");

-- CreateIndex
CREATE INDEX "idx_quiz_attempts_user" ON "quiz_attempts"("user_id");

-- CreateIndex
CREATE INDEX "idx_quizzes_lecture" ON "quizzes"("lecture_id");

-- CreateIndex
CREATE INDEX "idx_receipts_payment" ON "receipts"("payment_id");

-- CreateIndex
CREATE UNIQUE INDEX "referral_codes_user_id_key" ON "referral_codes"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "referral_codes_code_key" ON "referral_codes"("code");

-- CreateIndex
CREATE UNIQUE INDEX "referrals_referred_user_id_key" ON "referrals"("referred_user_id");

-- CreateIndex
CREATE INDEX "idx_referrals_referrer" ON "referrals"("referrer_user_id");

-- CreateIndex
CREATE INDEX "idx_referrals_status" ON "referrals"("status");

-- CreateIndex
CREATE INDEX "idx_refunds_payment" ON "refunds"("payment_id");

-- CreateIndex
CREATE INDEX "idx_reviews_course" ON "reviews"("course_id");

-- CreateIndex
CREATE UNIQUE INDEX "reviews_user_id_course_id_key" ON "reviews"("user_id", "course_id");

-- CreateIndex
CREATE INDEX "idx_sections_course" ON "sections"("course_id");

-- CreateIndex
CREATE UNIQUE INDEX "sections_course_id_order_no_key" ON "sections"("course_id", "order_no");

-- CreateIndex
CREATE INDEX "idx_subscriptions_user" ON "subscriptions"("user_id");

-- CreateIndex
CREATE INDEX "idx_user_sessions_user" ON "user_sessions"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- AddForeignKey
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_lecture_id_fkey" FOREIGN KEY ("lecture_id") REFERENCES "lectures"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "bookmarks" ADD CONSTRAINT "bookmarks_lecture_id_fkey" FOREIGN KEY ("lecture_id") REFERENCES "lectures"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "bookmarks" ADD CONSTRAINT "bookmarks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "cohort_members" ADD CONSTRAINT "cohort_members_cohort_id_fkey" FOREIGN KEY ("cohort_id") REFERENCES "cohorts"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "cohort_members" ADD CONSTRAINT "cohort_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "coupon_redemptions" ADD CONSTRAINT "coupon_redemptions_coupon_id_fkey" FOREIGN KEY ("coupon_id") REFERENCES "coupons"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "coupon_redemptions" ADD CONSTRAINT "coupon_redemptions_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "coupon_redemptions" ADD CONSTRAINT "coupon_redemptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "courses" ADD CONSTRAINT "courses_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "courses" ADD CONSTRAINT "courses_instructor_id_fkey" FOREIGN KEY ("instructor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "lectures" ADD CONSTRAINT "lectures_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "sections"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "offers" ADD CONSTRAINT "offers_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_coupon_id_fkey" FOREIGN KEY ("coupon_id") REFERENCES "coupons"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_offer_id_fkey" FOREIGN KEY ("offer_id") REFERENCES "offers"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "subscriptions"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "progress" ADD CONSTRAINT "progress_lecture_id_fkey" FOREIGN KEY ("lecture_id") REFERENCES "lectures"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "progress" ADD CONSTRAINT "progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "qna" ADD CONSTRAINT "qna_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "qna" ADD CONSTRAINT "qna_lecture_id_fkey" FOREIGN KEY ("lecture_id") REFERENCES "lectures"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "qna" ADD CONSTRAINT "qna_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "qna"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "qna" ADD CONSTRAINT "qna_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "quiz_attempts" ADD CONSTRAINT "quiz_attempts_quiz_id_fkey" FOREIGN KEY ("quiz_id") REFERENCES "quizzes"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "quiz_attempts" ADD CONSTRAINT "quiz_attempts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "quizzes" ADD CONSTRAINT "quizzes_lecture_id_fkey" FOREIGN KEY ("lecture_id") REFERENCES "lectures"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "receipts" ADD CONSTRAINT "receipts_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "referral_codes" ADD CONSTRAINT "referral_codes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_code_id_fkey" FOREIGN KEY ("code_id") REFERENCES "referral_codes"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_converted_payment_id_fkey" FOREIGN KEY ("converted_payment_id") REFERENCES "payments"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_referred_user_id_fkey" FOREIGN KEY ("referred_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_referrer_user_id_fkey" FOREIGN KEY ("referrer_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "rewards" ADD CONSTRAINT "rewards_referral_id_fkey" FOREIGN KEY ("referral_id") REFERENCES "referrals"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "rewards" ADD CONSTRAINT "rewards_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "sections" ADD CONSTRAINT "sections_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "plans"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

