ALTER TABLE "schedules" ADD COLUMN "reminder_offset_minutes" INTEGER NOT NULL DEFAULT 60;

UPDATE "schedules"
SET "reminder_offset_minutes" = CASE
  WHEN "reminder_lead" = '1w' THEN 10080
  ELSE 60
END;

UPDATE "schedules"
SET "reminder_at" = "scheduled_at" - ("reminder_offset_minutes" * INTERVAL '1 minute');

ALTER TABLE "schedules" DROP COLUMN "reminder_lead";
