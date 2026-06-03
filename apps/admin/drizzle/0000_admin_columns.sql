-- Better Auth admin plugin columns
-- Adds role/banned fields to "user" and impersonation tracking to "session".

ALTER TABLE "user"
  ADD COLUMN IF NOT EXISTS "role" text NOT NULL DEFAULT 'user',
  ADD COLUMN IF NOT EXISTS "banned" boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS "ban_reason" text,
  ADD COLUMN IF NOT EXISTS "ban_expires" timestamp;
--> statement-breakpoint
ALTER TABLE "session"
  ADD COLUMN IF NOT EXISTS "impersonated_by" text;
