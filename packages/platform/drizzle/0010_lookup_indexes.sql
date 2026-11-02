CREATE INDEX "orders_organization_id_customer_id_idx" ON "orders" USING btree ("organization_id","customer_id");--> statement-breakpoint
CREATE INDEX "apikey_key_idx" ON "apikey" USING btree ("key");