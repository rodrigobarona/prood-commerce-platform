ALTER TABLE "order_items" ADD COLUMN "variant_name" jsonb;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "payment_transaction_id" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "coupon_code" text;