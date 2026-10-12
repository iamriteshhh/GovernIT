-- AlterTable
ALTER TABLE "monitored_sources" ADD COLUMN     "auto_publish" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "official_notices" (
    "id" TEXT NOT NULL,
    "source_id" TEXT NOT NULL,
    "external_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "published_on" TIMESTAMP(3),
    "first_seen_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_seen_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "official_notices_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "official_notices_first_seen_at_idx" ON "official_notices"("first_seen_at");

-- CreateIndex
CREATE INDEX "official_notices_published_on_idx" ON "official_notices"("published_on");

-- CreateIndex
CREATE UNIQUE INDEX "official_notices_source_id_external_id_key" ON "official_notices"("source_id", "external_id");

-- AddForeignKey
ALTER TABLE "official_notices" ADD CONSTRAINT "official_notices_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "monitored_sources"("id") ON DELETE CASCADE ON UPDATE CASCADE;

