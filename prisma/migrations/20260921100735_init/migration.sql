-- CreateTable
CREATE TABLE "applications" (
    "id" UUID NOT NULL,
    "user_id" TEXT NOT NULL,
    "job_title" VARCHAR(100) NOT NULL,
    "company" VARCHAR(100) NOT NULL,
    "skills" VARCHAR(300) NOT NULL,
    "details" VARCHAR(1200) NOT NULL,
    "letter" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "deleted_at" TIMESTAMPTZ(3),

    CONSTRAINT "applications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "applications_user_id_deleted_at_id_idx" ON "applications"("user_id", "deleted_at", "id" DESC);

-- CreateIndex
CREATE INDEX "applications_deleted_at_idx" ON "applications"("deleted_at");
