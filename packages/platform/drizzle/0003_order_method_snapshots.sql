ALTER TABLE "product_option_values" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "product_options" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP POLICY "tenant_isolation" ON "product_option_values" CASCADE;--> statement-breakpoint
DROP TABLE "product_option_values" CASCADE;--> statement-breakpoint
DROP POLICY "tenant_isolation" ON "product_options" CASCADE;--> statement-breakpoint
DROP TABLE "product_options" CASCADE;--> statement-breakpoint
-- Text has no automatic cast to jsonb, and these columns held only a method's
-- name: not enough for a snapshot, so existing orders go back to no method.
ALTER TABLE "orders" ALTER COLUMN "shipping_method" SET DATA TYPE jsonb USING NULL::jsonb;--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "payment_method" SET DATA TYPE jsonb USING NULL::jsonb;--> statement-breakpoint
ALTER TABLE "store_info" ADD COLUMN "country" text DEFAULT 'PT' NOT NULL;