-- CreateEnum
CREATE TYPE "LifecycleState" AS ENUM ('ACTIVE', 'CANCELLED', 'WITHDRAWN', 'SUPERSEDED');

-- CreateEnum
CREATE TYPE "ApplyLinkKind" AS ENUM ('DIRECT_APPLICATION', 'APPLICATION_PORTAL', 'DEPARTMENT_SITE');

-- CreateEnum
CREATE TYPE "CheckOutcome" AS ENUM ('NOT_MODIFIED', 'UNCHANGED', 'CHANGED', 'FETCH_FAILED', 'PARSE_FAILED', 'BLOCKED');

-- CreateEnum
CREATE TYPE "CandidateKind" AS ENUM ('NEW_OPPORTUNITY', 'DATE_CHANGE', 'LINK_CHANGE', 'STATUS_CHANGE', 'NOTICE_UPDATED', 'LINK_BROKEN', 'PARSER_FAILURE');

-- CreateEnum
CREATE TYPE "CandidateState" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'AUTO_APPLIED');

-- CreateEnum
CREATE TYPE "JobTrigger" AS ENUM ('SCHEDULED', 'MANUAL');

-- DropIndex
DROP INDEX "schemes_deadline_idx";

-- AlterTable
ALTER TABLE "application_periods" ADD COLUMN     "is_rolling" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "opens_at" DROP NOT NULL;

-- AlterTable
ALTER TABLE "exams" ADD COLUMN     "apply_link_kind" "ApplyLinkKind" NOT NULL DEFAULT 'APPLICATION_PORTAL',
ADD COLUMN     "external_ref" TEXT,
ADD COLUMN     "lifecycle" "LifecycleState" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "lifecycle_note" TEXT,
ADD COLUMN     "monitored_source_id" TEXT;

-- Backfill: ApplicationPeriod becomes the only source of truth for scheme deadlines.
-- Precedence: an existing application_periods row (written by admin routes) wins over schemes.deadline.
-- Schemes with a deadline and no period get one closing at that deadline (opening date unknown -> NULL).
INSERT INTO "application_periods" ("id", "opens_at", "closes_at", "is_rolling", "scheme_id", "created_at", "updated_at")
SELECT gen_random_uuid()::text, NULL, s."deadline", false, s."id", NOW(), NOW()
FROM "schemes" s
WHERE s."deadline" IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM "application_periods" ap WHERE ap."scheme_id" = s."id");

-- Schemes with no deadline and no period were shown as "ongoing" before; keep that meaning explicitly.
INSERT INTO "application_periods" ("id", "opens_at", "closes_at", "is_rolling", "scheme_id", "created_at", "updated_at")
SELECT gen_random_uuid()::text, NULL, NULL, true, s."id", NOW(), NOW()
FROM "schemes" s
WHERE s."deadline" IS NULL
  AND NOT EXISTS (SELECT 1 FROM "application_periods" ap WHERE ap."scheme_id" = s."id");

-- AlterTable
ALTER TABLE "schemes" DROP COLUMN "deadline",
ADD COLUMN     "apply_link_kind" "ApplyLinkKind" NOT NULL DEFAULT 'DEPARTMENT_SITE',
ADD COLUMN     "lifecycle" "LifecycleState" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "lifecycle_note" TEXT,
ADD COLUMN     "monitored_source_id" TEXT,
ADD COLUMN     "program_ends_at" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "monitored_sources" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "organization" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "allowed_host" TEXT NOT NULL,
    "adapter_id" TEXT NOT NULL,
    "adapter_version" TEXT NOT NULL,
    "opportunity_type" TEXT NOT NULL,
    "check_interval_minutes" INTEGER NOT NULL DEFAULT 360,
    "stale_after_hours" INTEGER NOT NULL DEFAULT 72,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "last_attempt_at" TIMESTAMP(3),
    "last_success_at" TIMESTAMP(3),
    "last_content_change_at" TIMESTAMP(3),
    "next_check_at" TIMESTAMP(3),
    "last_outcome" "CheckOutcome",
    "last_error" TEXT,
    "consecutive_failures" INTEGER NOT NULL DEFAULT 0,
    "etag" TEXT,
    "last_modified" TEXT,
    "content_hash" TEXT,
    "snapshot" JSONB,
    "locked_until" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "monitored_sources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "source_checks" (
    "id" TEXT NOT NULL,
    "source_id" TEXT NOT NULL,
    "job_run_id" TEXT,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finished_at" TIMESTAMP(3),
    "outcome" "CheckOutcome",
    "http_status" INTEGER,
    "final_url" TEXT,
    "etag" TEXT,
    "last_modified" TEXT,
    "parser_version" TEXT,
    "items_found" INTEGER,
    "change_summary" TEXT,
    "error" TEXT,

    CONSTRAINT "source_checks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "change_candidates" (
    "id" TEXT NOT NULL,
    "source_id" TEXT,
    "check_id" TEXT,
    "kind" "CandidateKind" NOT NULL,
    "state" "CandidateState" NOT NULL DEFAULT 'PENDING',
    "external_id" TEXT,
    "title" TEXT NOT NULL,
    "evidence_url" TEXT,
    "proposed" JSONB NOT NULL,
    "current" JSONB,
    "reason" TEXT NOT NULL,
    "fingerprint" TEXT NOT NULL,
    "exam_id" TEXT,
    "scheme_id" TEXT,
    "reviewed_by" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "review_note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "change_candidates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_runs" (
    "id" TEXT NOT NULL,
    "trigger" "JobTrigger" NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finished_at" TIMESTAMP(3),
    "sources_attempted" INTEGER NOT NULL DEFAULT 0,
    "sources_succeeded" INTEGER NOT NULL DEFAULT 0,
    "sources_failed" INTEGER NOT NULL DEFAULT 0,
    "reviews_queued" INTEGER NOT NULL DEFAULT 0,
    "links_checked" INTEGER NOT NULL DEFAULT 0,
    "note" TEXT,

    CONSTRAINT "job_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "link_checks" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "last_checked_at" TIMESTAMP(3),
    "last_result" TEXT,
    "http_status" INTEGER,
    "final_url" TEXT,
    "consecutive_failures" INTEGER NOT NULL DEFAULT 0,
    "last_ok_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "link_checks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "actor" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "changes" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "monitored_sources_key_key" ON "monitored_sources"("key");

-- CreateIndex
CREATE INDEX "source_checks_source_id_started_at_idx" ON "source_checks"("source_id", "started_at");

-- CreateIndex
CREATE UNIQUE INDEX "change_candidates_fingerprint_key" ON "change_candidates"("fingerprint");

-- CreateIndex
CREATE INDEX "change_candidates_state_created_at_idx" ON "change_candidates"("state", "created_at");

-- CreateIndex
CREATE INDEX "job_runs_started_at_idx" ON "job_runs"("started_at");

-- CreateIndex
CREATE UNIQUE INDEX "link_checks_url_key" ON "link_checks"("url");

-- CreateIndex
CREATE INDEX "audit_logs_entity_type_entity_id_idx" ON "audit_logs"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "exams_external_ref_key" ON "exams"("external_ref");

-- AddForeignKey
ALTER TABLE "exams" ADD CONSTRAINT "exams_monitored_source_id_fkey" FOREIGN KEY ("monitored_source_id") REFERENCES "monitored_sources"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schemes" ADD CONSTRAINT "schemes_monitored_source_id_fkey" FOREIGN KEY ("monitored_source_id") REFERENCES "monitored_sources"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "source_checks" ADD CONSTRAINT "source_checks_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "monitored_sources"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "source_checks" ADD CONSTRAINT "source_checks_job_run_id_fkey" FOREIGN KEY ("job_run_id") REFERENCES "job_runs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "change_candidates" ADD CONSTRAINT "change_candidates_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "monitored_sources"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "change_candidates" ADD CONSTRAINT "change_candidates_check_id_fkey" FOREIGN KEY ("check_id") REFERENCES "source_checks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "change_candidates" ADD CONSTRAINT "change_candidates_exam_id_fkey" FOREIGN KEY ("exam_id") REFERENCES "exams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "change_candidates" ADD CONSTRAINT "change_candidates_scheme_id_fkey" FOREIGN KEY ("scheme_id") REFERENCES "schemes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

