-- Platform subscription fields on organization (Better Auth org = one store).
-- Safe to run multiple times (IF NOT EXISTS).

ALTER TABLE "organization" ADD COLUMN IF NOT EXISTS "plan_id" text NOT NULL DEFAULT 'free';
--> statement-breakpoint
ALTER TABLE "organization" ADD COLUMN IF NOT EXISTS "plan_status" text NOT NULL DEFAULT 'active';
--> statement-breakpoint
ALTER TABLE "organization" ADD COLUMN IF NOT EXISTS "stripe_customer_id" text;
--> statement-breakpoint
ALTER TABLE "organization" ADD COLUMN IF NOT EXISTS "stripe_subscription_id" text;
--> statement-breakpoint
UPDATE "organization" SET "plan_id" = 'free' WHERE "plan_id" IS NULL OR "plan_id" = '';
--> statement-breakpoint
UPDATE "organization" SET "plan_status" = 'active' WHERE "plan_status" IS NULL OR "plan_status" = '';
