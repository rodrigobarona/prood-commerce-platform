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
ALTER TABLE "agent" ADD CONSTRAINT "agent_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "agent" ADD CONSTRAINT "agent_host_id_agentHost_id_fk" FOREIGN KEY ("host_id") REFERENCES "public"."agentHost"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "agentCapabilityGrant" ADD CONSTRAINT "agentCapabilityGrant_agent_id_agent_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agent"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "agentCapabilityGrant" ADD CONSTRAINT "agentCapabilityGrant_denied_by_user_id_fk" FOREIGN KEY ("denied_by") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "agentCapabilityGrant" ADD CONSTRAINT "agentCapabilityGrant_granted_by_user_id_fk" FOREIGN KEY ("granted_by") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "agentHost" ADD CONSTRAINT "agentHost_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "approvalRequest" ADD CONSTRAINT "approvalRequest_agent_id_agent_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agent"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "approvalRequest" ADD CONSTRAINT "approvalRequest_host_id_agentHost_id_fk" FOREIGN KEY ("host_id") REFERENCES "public"."agentHost"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "approvalRequest" ADD CONSTRAINT "approvalRequest_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
