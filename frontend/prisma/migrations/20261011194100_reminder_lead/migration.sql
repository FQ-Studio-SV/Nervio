ALTER TABLE "schedules" ADD COLUMN "candidate_name" TEXT NOT NULL DEFAULT '';
ALTER TABLE "schedules" ADD COLUMN "reminder_lead" TEXT NOT NULL DEFAULT '1h';
ALTER TABLE "schedules" ADD COLUMN "reminder_at" TIMESTAMPTZ(6);

UPDATE "schedules"
SET "reminder_at" = "scheduled_at" - INTERVAL '1 hour';

ALTER TABLE "schedules" ALTER COLUMN "reminder_at" SET NOT NULL;

UPDATE "schedules"
SET "reminder_email_sent" = false
WHERE "scheduled_at" > NOW();

CREATE INDEX "idx_schedules_reminder_due" ON "schedules"("reminder_email_sent", "reminder_at");
