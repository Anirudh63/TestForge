ALTER TABLE "test_cases" ADD COLUMN "logs" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "test_cases" ADD COLUMN "session_id" varchar(255);--> statement-breakpoint
ALTER TABLE "test_cases" ADD COLUMN "session_url" varchar(500);