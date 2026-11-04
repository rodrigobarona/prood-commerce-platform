CREATE TABLE "agent_event" (
	"id" text PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"organization_id" text,
	"agent_id" text,
	"host_id" text,
	"actor_id" text,
	"actor_type" text,
	"capability" text,
	"status" text,
	"error" text,
	"duration_ms" integer,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "agent_event" ADD CONSTRAINT "agent_event_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "agent_event_org_created_idx" ON "agent_event" USING btree ("organization_id","created_at");--> statement-breakpoint
CREATE INDEX "agent_event_agent_created_idx" ON "agent_event" USING btree ("agent_id","created_at");--> statement-breakpoint
-- Like the other auth tables, the agent audit log is read through the connecting role only.
REVOKE ALL ON TABLE "agent_event" FROM prood_app;
