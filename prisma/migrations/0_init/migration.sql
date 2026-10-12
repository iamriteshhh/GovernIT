-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "OrgType" AS ENUM ('CENTRAL', 'STATE');

-- CreateEnum
CREATE TYPE "SourceType" AS ENUM ('OFFICIAL_NOTIFICATION', 'OFFICIAL_GUIDELINE', 'OFFICIAL_APPLICATION_PORTAL', 'OTHER_OFFICIAL');

-- CreateTable
CREATE TABLE "organizations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "OrgType" NOT NULL DEFAULT 'CENTRAL',
    "parent_org_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "states" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "states_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exams" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "conducting_body_id" TEXT NOT NULL,
    "department" TEXT,
    "education_eligibility" TEXT NOT NULL,
    "age_eligibility" TEXT NOT NULL,
    "state_id" TEXT,
    "exam_date" TIMESTAMP(3),
    "admit_card_date" TIMESTAMP(3),
    "result_date" TIMESTAMP(3),
    "result_status" TEXT,
    "application_fee" TEXT,
    "vacancy_count" INTEGER,
    "official_apply_url" TEXT NOT NULL,
    "is_published" BOOLEAN NOT NULL DEFAULT true,
    "is_archived" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "schemes" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "department_id" TEXT NOT NULL,
    "who_can_benefit" TEXT NOT NULL,
    "eligibility" TEXT NOT NULL,
    "benefits" TEXT NOT NULL,
    "required_documents" TEXT NOT NULL,
    "application_process" TEXT NOT NULL,
    "deadline" TIMESTAMP(3),
    "state_id" TEXT,
    "official_apply_url" TEXT NOT NULL,
    "is_published" BOOLEAN NOT NULL DEFAULT true,
    "is_archived" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "schemes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "application_periods" (
    "id" TEXT NOT NULL,
    "opens_at" TIMESTAMP(3) NOT NULL,
    "closes_at" TIMESTAMP(3),
    "exam_id" TEXT,
    "scheme_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "application_periods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sources" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "type" "SourceType" NOT NULL,
    "title" TEXT,
    "retrieved_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "exam_id" TEXT,
    "scheme_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verifications" (
    "id" TEXT NOT NULL,
    "verified_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verified_by" TEXT NOT NULL DEFAULT 'editorial_admin',
    "notes" TEXT,
    "exam_id" TEXT,
    "scheme_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "verifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "eligibility_criteria" (
    "id" TEXT NOT NULL,
    "min_age" INTEGER,
    "max_age" INTEGER,
    "education_level" TEXT,
    "income_band" TEXT,
    "applicable_states" TEXT,
    "occupation_tags" TEXT,
    "exam_id" TEXT,
    "scheme_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "eligibility_criteria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exam_categories" (
    "exam_id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,

    CONSTRAINT "exam_categories_pkey" PRIMARY KEY ("exam_id","category_id")
);

-- CreateTable
CREATE TABLE "scheme_categories" (
    "scheme_id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,

    CONSTRAINT "scheme_categories_pkey" PRIMARY KEY ("scheme_id","category_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "organizations_name_key" ON "organizations"("name");

-- CreateIndex
CREATE UNIQUE INDEX "states_name_key" ON "states"("name");

-- CreateIndex
CREATE UNIQUE INDEX "states_code_key" ON "states"("code");

-- CreateIndex
CREATE UNIQUE INDEX "categories_name_key" ON "categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "categories_slug_key" ON "categories"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "exams_slug_key" ON "exams"("slug");

-- CreateIndex
CREATE INDEX "exams_slug_idx" ON "exams"("slug");

-- CreateIndex
CREATE INDEX "exams_state_id_idx" ON "exams"("state_id");

-- CreateIndex
CREATE UNIQUE INDEX "schemes_slug_key" ON "schemes"("slug");

-- CreateIndex
CREATE INDEX "schemes_slug_idx" ON "schemes"("slug");

-- CreateIndex
CREATE INDEX "schemes_state_id_idx" ON "schemes"("state_id");

-- CreateIndex
CREATE INDEX "schemes_deadline_idx" ON "schemes"("deadline");

-- CreateIndex
CREATE UNIQUE INDEX "application_periods_exam_id_key" ON "application_periods"("exam_id");

-- CreateIndex
CREATE UNIQUE INDEX "application_periods_scheme_id_key" ON "application_periods"("scheme_id");

-- CreateIndex
CREATE INDEX "application_periods_closes_at_idx" ON "application_periods"("closes_at");

-- CreateIndex
CREATE INDEX "sources_exam_id_idx" ON "sources"("exam_id");

-- CreateIndex
CREATE INDEX "sources_scheme_id_idx" ON "sources"("scheme_id");

-- CreateIndex
CREATE INDEX "verifications_exam_id_idx" ON "verifications"("exam_id");

-- CreateIndex
CREATE INDEX "verifications_scheme_id_idx" ON "verifications"("scheme_id");

-- CreateIndex
CREATE INDEX "verifications_verified_at_idx" ON "verifications"("verified_at");

-- CreateIndex
CREATE UNIQUE INDEX "eligibility_criteria_exam_id_key" ON "eligibility_criteria"("exam_id");

-- CreateIndex
CREATE UNIQUE INDEX "eligibility_criteria_scheme_id_key" ON "eligibility_criteria"("scheme_id");

-- AddForeignKey
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_parent_org_id_fkey" FOREIGN KEY ("parent_org_id") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exams" ADD CONSTRAINT "exams_conducting_body_id_fkey" FOREIGN KEY ("conducting_body_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exams" ADD CONSTRAINT "exams_state_id_fkey" FOREIGN KEY ("state_id") REFERENCES "states"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schemes" ADD CONSTRAINT "schemes_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "schemes" ADD CONSTRAINT "schemes_state_id_fkey" FOREIGN KEY ("state_id") REFERENCES "states"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_periods" ADD CONSTRAINT "application_periods_exam_id_fkey" FOREIGN KEY ("exam_id") REFERENCES "exams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_periods" ADD CONSTRAINT "application_periods_scheme_id_fkey" FOREIGN KEY ("scheme_id") REFERENCES "schemes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sources" ADD CONSTRAINT "sources_exam_id_fkey" FOREIGN KEY ("exam_id") REFERENCES "exams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sources" ADD CONSTRAINT "sources_scheme_id_fkey" FOREIGN KEY ("scheme_id") REFERENCES "schemes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verifications" ADD CONSTRAINT "verifications_exam_id_fkey" FOREIGN KEY ("exam_id") REFERENCES "exams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verifications" ADD CONSTRAINT "verifications_scheme_id_fkey" FOREIGN KEY ("scheme_id") REFERENCES "schemes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eligibility_criteria" ADD CONSTRAINT "eligibility_criteria_exam_id_fkey" FOREIGN KEY ("exam_id") REFERENCES "exams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eligibility_criteria" ADD CONSTRAINT "eligibility_criteria_scheme_id_fkey" FOREIGN KEY ("scheme_id") REFERENCES "schemes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_categories" ADD CONSTRAINT "exam_categories_exam_id_fkey" FOREIGN KEY ("exam_id") REFERENCES "exams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_categories" ADD CONSTRAINT "exam_categories_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scheme_categories" ADD CONSTRAINT "scheme_categories_scheme_id_fkey" FOREIGN KEY ("scheme_id") REFERENCES "schemes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scheme_categories" ADD CONSTRAINT "scheme_categories_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

