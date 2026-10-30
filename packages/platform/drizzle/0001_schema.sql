CREATE TABLE "categories" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text DEFAULT nullif(current_setting('app.current_org_id', true), '') NOT NULL,
	"name" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"slug" text NOT NULL,
	"description" jsonb,
	"image" text,
	"parent_id" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "categories_organization_id_slug_unique" UNIQUE("organization_id","slug")
);
--> statement-breakpoint
ALTER TABLE "categories" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "product_attributes" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text DEFAULT nullif(current_setting('app.current_org_id', true), '') NOT NULL,
	"product_id" text NOT NULL,
	"code" text NOT NULL,
	"name" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"value" jsonb DEFAULT '{}'::jsonb NOT NULL
);
--> statement-breakpoint
ALTER TABLE "product_attributes" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "product_categories" (
	"organization_id" text DEFAULT nullif(current_setting('app.current_org_id', true), '') NOT NULL,
	"product_id" text NOT NULL,
	"category_id" text NOT NULL,
	CONSTRAINT "product_categories_product_id_category_id_pk" PRIMARY KEY("product_id","category_id")
);
--> statement-breakpoint
ALTER TABLE "product_categories" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "product_images" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text DEFAULT nullif(current_setting('app.current_org_id', true), '') NOT NULL,
	"product_id" text NOT NULL,
	"url" text NOT NULL,
	"alt_text" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
ALTER TABLE "product_images" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "product_option_values" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text DEFAULT nullif(current_setting('app.current_org_id', true), '') NOT NULL,
	"option_id" text NOT NULL,
	"name" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "product_option_values" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "product_options" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text DEFAULT nullif(current_setting('app.current_org_id', true), '') NOT NULL,
	"product_id" text NOT NULL,
	"name" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "product_options" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "product_tags" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text DEFAULT nullif(current_setting('app.current_org_id', true), '') NOT NULL,
	"product_id" text NOT NULL,
	"tag" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "product_tags" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "product_variants" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text DEFAULT nullif(current_setting('app.current_org_id', true), '') NOT NULL,
	"product_id" text NOT NULL,
	"sku" text,
	"name" jsonb,
	"price" numeric(12, 2),
	"compare_at_price" numeric(12, 2),
	"in_stock" boolean DEFAULT true NOT NULL,
	"inventory_quantity" integer,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "product_variants" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "products" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text DEFAULT nullif(current_setting('app.current_org_id', true), '') NOT NULL,
	"sku" text,
	"name" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"slug" text NOT NULL,
	"description" jsonb,
	"short_description" jsonb,
	"price" numeric(12, 2),
	"compare_at_price" numeric(12, 2),
	"currency" text DEFAULT 'EUR' NOT NULL,
	"product_type" text DEFAULT 'physical' NOT NULL,
	"in_stock" boolean DEFAULT true NOT NULL,
	"inventory_quantity" integer,
	"quantity_limit" integer,
	"vat_included" boolean DEFAULT true NOT NULL,
	"vat_rate" double precision,
	"requires_shipping" boolean DEFAULT true NOT NULL,
	"is_dropshipped" boolean DEFAULT false NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "products_organization_id_slug_unique" UNIQUE("organization_id","slug")
);
--> statement-breakpoint
ALTER TABLE "products" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "customer_addresses" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text DEFAULT nullif(current_setting('app.current_org_id', true), '') NOT NULL,
	"customer_id" text NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"phone" text,
	"street" text NOT NULL,
	"street2" text,
	"city" text NOT NULL,
	"state" text,
	"country" text NOT NULL,
	"postal_code" text,
	"district" text,
	"national_address" text,
	"additional_number" text,
	"is_default" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
ALTER TABLE "customer_addresses" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "customers" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text DEFAULT nullif(current_setting('app.current_org_id', true), '') NOT NULL,
	"auth_user_id" text,
	"email" text,
	"first_name" text,
	"last_name" text,
	"phone" text,
	"default_address_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "customers_organization_id_auth_user_id_unique" UNIQUE("organization_id","auth_user_id")
);
--> statement-breakpoint
ALTER TABLE "customers" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "cart_items" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text DEFAULT nullif(current_setting('app.current_org_id', true), '') NOT NULL,
	"cart_id" text NOT NULL,
	"product_id" text NOT NULL,
	"variant_id" text,
	"quantity" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "cart_items" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "carts" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text DEFAULT nullif(current_setting('app.current_org_id', true), '') NOT NULL,
	"customer_id" text,
	"coupon_code" text,
	"shipping_address" jsonb,
	"billing_address" jsonb,
	"shipping_method_id" text,
	"payment_method_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "carts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "order_history" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text DEFAULT nullif(current_setting('app.current_org_id', true), '') NOT NULL,
	"order_id" text NOT NULL,
	"from_status" text,
	"to_status" text NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "order_history" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text DEFAULT nullif(current_setting('app.current_org_id', true), '') NOT NULL,
	"order_id" text NOT NULL,
	"product_id" text NOT NULL,
	"variant_id" text,
	"name" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"image" text,
	"quantity" integer NOT NULL,
	"price" numeric(12, 2) NOT NULL,
	"total_price" numeric(12, 2) NOT NULL,
	"product_type" text DEFAULT 'physical' NOT NULL,
	"fulfillment_status" text DEFAULT 'unfulfilled' NOT NULL
);
--> statement-breakpoint
ALTER TABLE "order_items" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "orders" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text DEFAULT nullif(current_setting('app.current_org_id', true), '') NOT NULL,
	"order_number" text NOT NULL,
	"customer_id" text,
	"contact_email" text,
	"status" text DEFAULT 'placed' NOT NULL,
	"payment_status" text DEFAULT 'unpaid' NOT NULL,
	"fulfillment_status" text DEFAULT 'unfulfilled' NOT NULL,
	"subtotal" numeric(12, 2) DEFAULT '0' NOT NULL,
	"shipping_cost" numeric(12, 2),
	"tax" numeric(12, 2),
	"discount" numeric(12, 2),
	"total" numeric(12, 2) DEFAULT '0' NOT NULL,
	"currency" text DEFAULT 'EUR' NOT NULL,
	"shipping_address" jsonb,
	"billing_address" jsonb,
	"shipping_method" text,
	"payment_method" text,
	"tracking_number" text,
	"tracking_url" text,
	"note" text,
	"requires_shipping" boolean DEFAULT true NOT NULL,
	"placed_at" timestamp with time zone,
	"approved_at" timestamp with time zone,
	"cancelled_at" timestamp with time zone,
	"fulfilled_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "orders_organization_id_order_number_unique" UNIQUE("organization_id","order_number")
);
--> statement-breakpoint
ALTER TABLE "orders" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "store_info" (
	"id" text DEFAULT 'default' NOT NULL,
	"organization_id" text DEFAULT nullif(current_setting('app.current_org_id', true), '') NOT NULL,
	"name" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"description" jsonb,
	"logo" text,
	"favicon" text,
	"currency" text DEFAULT 'EUR' NOT NULL,
	"locale" text DEFAULT 'en' NOT NULL,
	"supported_currencies" jsonb DEFAULT '["EUR"]'::jsonb,
	"supported_locales" jsonb DEFAULT '["en","pt","es"]'::jsonb,
	"timezone" text DEFAULT 'Europe/Lisbon' NOT NULL,
	"contact_email" text,
	"contact_phone" text,
	"address" text,
	"social_links" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "store_info_organization_id_id_pk" PRIMARY KEY("organization_id","id")
);
--> statement-breakpoint
ALTER TABLE "store_info" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "brands" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text DEFAULT nullif(current_setting('app.current_org_id', true), '') NOT NULL,
	"name" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"slug" text NOT NULL,
	"logo" text,
	"description" jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "brands_organization_id_slug_unique" UNIQUE("organization_id","slug")
);
--> statement-breakpoint
ALTER TABLE "brands" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "countries" (
	"id" text PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"name" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"calling_code" text,
	"currency" text,
	"capital" text,
	"is_active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "countries_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "wishlist_items" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text DEFAULT nullif(current_setting('app.current_org_id', true), '') NOT NULL,
	"wishlist_id" text NOT NULL,
	"product_id" text NOT NULL,
	"variant_id" text,
	"added_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "wishlist_items" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "wishlists" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text DEFAULT nullif(current_setting('app.current_org_id', true), '') NOT NULL,
	"customer_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "wishlists" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text DEFAULT nullif(current_setting('app.current_org_id', true), '') NOT NULL,
	"product_id" text NOT NULL,
	"author_name" text NOT NULL,
	"rating" integer NOT NULL,
	"title" text,
	"body" text,
	"verified" boolean DEFAULT false NOT NULL,
	"status" text DEFAULT 'published' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "reviews" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "coupons" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text DEFAULT nullif(current_setting('app.current_org_id', true), '') NOT NULL,
	"code" text NOT NULL,
	"promotion_id" text NOT NULL,
	"is_valid" boolean DEFAULT true NOT NULL,
	"invalid_reason" text,
	"times_used" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "coupons_organization_id_code_unique" UNIQUE("organization_id","code")
);
--> statement-breakpoint
ALTER TABLE "coupons" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "promotions" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text DEFAULT nullif(current_setting('app.current_org_id', true), '') NOT NULL,
	"name" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"description" jsonb,
	"discount_type" text DEFAULT 'percentage' NOT NULL,
	"discount_value" numeric(12, 2) DEFAULT '0' NOT NULL,
	"currency" text,
	"max_discount" numeric(12, 2),
	"target" text DEFAULT 'order' NOT NULL,
	"conditions_json" text,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone,
	"is_active" boolean DEFAULT true NOT NULL,
	"requires_coupon" boolean DEFAULT false NOT NULL,
	"usage_limit_per_customer" integer,
	"usage_limit_total" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "promotions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "return_items" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text DEFAULT nullif(current_setting('app.current_org_id', true), '') NOT NULL,
	"return_id" text NOT NULL,
	"order_item_id" text NOT NULL,
	"product_id" text NOT NULL,
	"variant_id" text,
	"name" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"image" text,
	"quantity" integer NOT NULL,
	"reason" text DEFAULT 'other' NOT NULL,
	"reason_note" text
);
--> statement-breakpoint
ALTER TABLE "return_items" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "returns" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text DEFAULT nullif(current_setting('app.current_org_id', true), '') NOT NULL,
	"order_id" text NOT NULL,
	"order_number" text NOT NULL,
	"status" text DEFAULT 'requested' NOT NULL,
	"refund_amount" numeric(12, 2),
	"refund_currency" text,
	"refund_method" text,
	"return_shipping_label" text,
	"return_tracking_number" text,
	"merchant_note" text,
	"customer_note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "returns" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agent" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"user_id" text,
	"host_id" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"mode" text DEFAULT 'delegated' NOT NULL,
	"public_key" text NOT NULL,
	"kid" text,
	"jwks_url" text,
	"last_used_at" timestamp,
	"activated_at" timestamp,
	"expires_at" timestamp,
	"metadata" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agentCapabilityGrant" (
	"id" text PRIMARY KEY NOT NULL,
	"agent_id" text NOT NULL,
	"capability" text NOT NULL,
	"denied_by" text,
	"granted_by" text,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"reason" text,
	"constraints" text
);
--> statement-breakpoint
CREATE TABLE "agentHost" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"user_id" text,
	"default_capabilities" text,
	"public_key" text,
	"kid" text,
	"jwks_url" text,
	"enrollment_token_hash" text,
	"enrollment_token_expires_at" timestamp,
	"status" text DEFAULT 'active' NOT NULL,
	"activated_at" timestamp,
	"expires_at" timestamp,
	"last_used_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "apikey" (
	"id" text PRIMARY KEY NOT NULL,
	"config_id" text DEFAULT 'default' NOT NULL,
	"name" text,
	"start" text,
	"reference_id" text NOT NULL,
	"prefix" text,
	"key" text NOT NULL,
	"refill_interval" integer,
	"refill_amount" integer,
	"last_refill_at" timestamp,
	"enabled" boolean DEFAULT true NOT NULL,
	"rate_limit_enabled" boolean DEFAULT true NOT NULL,
	"rate_limit_time_window" integer,
	"rate_limit_max" integer,
	"request_count" integer DEFAULT 0 NOT NULL,
	"remaining" integer,
	"last_request" timestamp,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"permissions" text,
	"metadata" text
);
--> statement-breakpoint
CREATE TABLE "approvalRequest" (
	"id" text PRIMARY KEY NOT NULL,
	"method" text NOT NULL,
	"agent_id" text,
	"host_id" text,
	"user_id" text,
	"capabilities" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"user_code_hash" text,
	"login_hint" text,
	"binding_message" text,
	"client_notification_token" text,
	"client_notification_endpoint" text,
	"delivery_mode" text,
	"interval" integer NOT NULL,
	"last_polled_at" timestamp,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "integration_config" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"provider" text NOT NULL,
	"config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"enabled" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invitation" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"email" text NOT NULL,
	"role" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"expires_at" timestamp NOT NULL,
	"inviter_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "member" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"user_id" text NOT NULL,
	"role" text DEFAULT 'member' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organization" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"logo" text,
	"metadata" text,
	"plan_id" text DEFAULT 'free' NOT NULL,
	"plan_status" text DEFAULT 'active' NOT NULL,
	"stripe_customer_id" text,
	"stripe_subscription_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "organization_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	"active_organization_id" text,
	"impersonated_by" text,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "tenant_domain" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"domain" text NOT NULL,
	"verified" boolean DEFAULT false NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	"dns_records" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "tenant_domain_domain_unique" UNIQUE("domain")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"role" text DEFAULT 'user' NOT NULL,
	"banned" boolean DEFAULT false,
	"ban_reason" text,
	"ban_expires" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_parent_id_categories_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_attributes" ADD CONSTRAINT "product_attributes_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_categories" ADD CONSTRAINT "product_categories_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_categories" ADD CONSTRAINT "product_categories_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_images" ADD CONSTRAINT "product_images_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_option_values" ADD CONSTRAINT "product_option_values_option_id_product_options_id_fk" FOREIGN KEY ("option_id") REFERENCES "public"."product_options"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_options" ADD CONSTRAINT "product_options_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_tags" ADD CONSTRAINT "product_tags_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_addresses" ADD CONSTRAINT "customer_addresses_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_cart_id_carts_id_fk" FOREIGN KEY ("cart_id") REFERENCES "public"."carts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "carts" ADD CONSTRAINT "carts_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_history" ADD CONSTRAINT "order_history_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wishlist_items" ADD CONSTRAINT "wishlist_items_wishlist_id_wishlists_id_fk" FOREIGN KEY ("wishlist_id") REFERENCES "public"."wishlists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wishlist_items" ADD CONSTRAINT "wishlist_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wishlists" ADD CONSTRAINT "wishlists_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupons" ADD CONSTRAINT "coupons_promotion_id_promotions_id_fk" FOREIGN KEY ("promotion_id") REFERENCES "public"."promotions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "return_items" ADD CONSTRAINT "return_items_return_id_returns_id_fk" FOREIGN KEY ("return_id") REFERENCES "public"."returns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "returns" ADD CONSTRAINT "returns_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent" ADD CONSTRAINT "agent_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent" ADD CONSTRAINT "agent_host_id_agentHost_id_fk" FOREIGN KEY ("host_id") REFERENCES "public"."agentHost"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agentCapabilityGrant" ADD CONSTRAINT "agentCapabilityGrant_agent_id_agent_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agent"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agentCapabilityGrant" ADD CONSTRAINT "agentCapabilityGrant_denied_by_user_id_fk" FOREIGN KEY ("denied_by") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agentCapabilityGrant" ADD CONSTRAINT "agentCapabilityGrant_granted_by_user_id_fk" FOREIGN KEY ("granted_by") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agentHost" ADD CONSTRAINT "agentHost_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approvalRequest" ADD CONSTRAINT "approvalRequest_agent_id_agent_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agent"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approvalRequest" ADD CONSTRAINT "approvalRequest_host_id_agentHost_id_fk" FOREIGN KEY ("host_id") REFERENCES "public"."agentHost"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approvalRequest" ADD CONSTRAINT "approvalRequest_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "integration_config" ADD CONSTRAINT "integration_config_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitation" ADD CONSTRAINT "invitation_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitation" ADD CONSTRAINT "invitation_inviter_id_user_id_fk" FOREIGN KEY ("inviter_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member" ADD CONSTRAINT "member_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member" ADD CONSTRAINT "member_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_domain" ADD CONSTRAINT "tenant_domain_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "product_attributes_organization_id_index" ON "product_attributes" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "product_categories_organization_id_index" ON "product_categories" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "product_images_organization_id_index" ON "product_images" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "product_option_values_organization_id_index" ON "product_option_values" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "product_options_organization_id_index" ON "product_options" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "product_tags_organization_id_index" ON "product_tags" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "product_variants_organization_id_index" ON "product_variants" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "customer_addresses_organization_id_index" ON "customer_addresses" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "cart_items_organization_id_index" ON "cart_items" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "carts_organization_id_index" ON "carts" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "order_history_organization_id_index" ON "order_history" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "order_items_organization_id_index" ON "order_items" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "wishlist_items_organization_id_index" ON "wishlist_items" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "wishlists_organization_id_index" ON "wishlists" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "reviews_organization_id_index" ON "reviews" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "promotions_organization_id_index" ON "promotions" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "return_items_organization_id_index" ON "return_items" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "returns_organization_id_index" ON "returns" USING btree ("organization_id");--> statement-breakpoint
CREATE UNIQUE INDEX "agentCapabilityGrant_agent_id_capability_unique" ON "agentCapabilityGrant" USING btree ("agent_id","capability");--> statement-breakpoint
CREATE UNIQUE INDEX "integration_config_org_provider_idx" ON "integration_config" USING btree ("organization_id","provider");--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "categories" AS PERMISSIVE FOR ALL TO "prood_app" USING (organization_id = nullif(current_setting('app.current_org_id', true), '')) WITH CHECK (organization_id = nullif(current_setting('app.current_org_id', true), ''));--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "product_attributes" AS PERMISSIVE FOR ALL TO "prood_app" USING (organization_id = nullif(current_setting('app.current_org_id', true), '')) WITH CHECK (organization_id = nullif(current_setting('app.current_org_id', true), ''));--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "product_categories" AS PERMISSIVE FOR ALL TO "prood_app" USING (organization_id = nullif(current_setting('app.current_org_id', true), '')) WITH CHECK (organization_id = nullif(current_setting('app.current_org_id', true), ''));--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "product_images" AS PERMISSIVE FOR ALL TO "prood_app" USING (organization_id = nullif(current_setting('app.current_org_id', true), '')) WITH CHECK (organization_id = nullif(current_setting('app.current_org_id', true), ''));--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "product_option_values" AS PERMISSIVE FOR ALL TO "prood_app" USING (organization_id = nullif(current_setting('app.current_org_id', true), '')) WITH CHECK (organization_id = nullif(current_setting('app.current_org_id', true), ''));--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "product_options" AS PERMISSIVE FOR ALL TO "prood_app" USING (organization_id = nullif(current_setting('app.current_org_id', true), '')) WITH CHECK (organization_id = nullif(current_setting('app.current_org_id', true), ''));--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "product_tags" AS PERMISSIVE FOR ALL TO "prood_app" USING (organization_id = nullif(current_setting('app.current_org_id', true), '')) WITH CHECK (organization_id = nullif(current_setting('app.current_org_id', true), ''));--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "product_variants" AS PERMISSIVE FOR ALL TO "prood_app" USING (organization_id = nullif(current_setting('app.current_org_id', true), '')) WITH CHECK (organization_id = nullif(current_setting('app.current_org_id', true), ''));--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "products" AS PERMISSIVE FOR ALL TO "prood_app" USING (organization_id = nullif(current_setting('app.current_org_id', true), '')) WITH CHECK (organization_id = nullif(current_setting('app.current_org_id', true), ''));--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "customer_addresses" AS PERMISSIVE FOR ALL TO "prood_app" USING (organization_id = nullif(current_setting('app.current_org_id', true), '')) WITH CHECK (organization_id = nullif(current_setting('app.current_org_id', true), ''));--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "customers" AS PERMISSIVE FOR ALL TO "prood_app" USING (organization_id = nullif(current_setting('app.current_org_id', true), '')) WITH CHECK (organization_id = nullif(current_setting('app.current_org_id', true), ''));--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "cart_items" AS PERMISSIVE FOR ALL TO "prood_app" USING (organization_id = nullif(current_setting('app.current_org_id', true), '')) WITH CHECK (organization_id = nullif(current_setting('app.current_org_id', true), ''));--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "carts" AS PERMISSIVE FOR ALL TO "prood_app" USING (organization_id = nullif(current_setting('app.current_org_id', true), '')) WITH CHECK (organization_id = nullif(current_setting('app.current_org_id', true), ''));--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "order_history" AS PERMISSIVE FOR ALL TO "prood_app" USING (organization_id = nullif(current_setting('app.current_org_id', true), '')) WITH CHECK (organization_id = nullif(current_setting('app.current_org_id', true), ''));--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "order_items" AS PERMISSIVE FOR ALL TO "prood_app" USING (organization_id = nullif(current_setting('app.current_org_id', true), '')) WITH CHECK (organization_id = nullif(current_setting('app.current_org_id', true), ''));--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "orders" AS PERMISSIVE FOR ALL TO "prood_app" USING (organization_id = nullif(current_setting('app.current_org_id', true), '')) WITH CHECK (organization_id = nullif(current_setting('app.current_org_id', true), ''));--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "store_info" AS PERMISSIVE FOR ALL TO "prood_app" USING (organization_id = nullif(current_setting('app.current_org_id', true), '')) WITH CHECK (organization_id = nullif(current_setting('app.current_org_id', true), ''));--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "brands" AS PERMISSIVE FOR ALL TO "prood_app" USING (organization_id = nullif(current_setting('app.current_org_id', true), '')) WITH CHECK (organization_id = nullif(current_setting('app.current_org_id', true), ''));--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "wishlist_items" AS PERMISSIVE FOR ALL TO "prood_app" USING (organization_id = nullif(current_setting('app.current_org_id', true), '')) WITH CHECK (organization_id = nullif(current_setting('app.current_org_id', true), ''));--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "wishlists" AS PERMISSIVE FOR ALL TO "prood_app" USING (organization_id = nullif(current_setting('app.current_org_id', true), '')) WITH CHECK (organization_id = nullif(current_setting('app.current_org_id', true), ''));--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "reviews" AS PERMISSIVE FOR ALL TO "prood_app" USING (organization_id = nullif(current_setting('app.current_org_id', true), '')) WITH CHECK (organization_id = nullif(current_setting('app.current_org_id', true), ''));--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "coupons" AS PERMISSIVE FOR ALL TO "prood_app" USING (organization_id = nullif(current_setting('app.current_org_id', true), '')) WITH CHECK (organization_id = nullif(current_setting('app.current_org_id', true), ''));--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "promotions" AS PERMISSIVE FOR ALL TO "prood_app" USING (organization_id = nullif(current_setting('app.current_org_id', true), '')) WITH CHECK (organization_id = nullif(current_setting('app.current_org_id', true), ''));--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "return_items" AS PERMISSIVE FOR ALL TO "prood_app" USING (organization_id = nullif(current_setting('app.current_org_id', true), '')) WITH CHECK (organization_id = nullif(current_setting('app.current_org_id', true), ''));--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "returns" AS PERMISSIVE FOR ALL TO "prood_app" USING (organization_id = nullif(current_setting('app.current_org_id', true), '')) WITH CHECK (organization_id = nullif(current_setting('app.current_org_id', true), ''));