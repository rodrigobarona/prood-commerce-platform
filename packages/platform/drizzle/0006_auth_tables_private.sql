-- Auth tables are read through the connecting role, never inside withTenant().
-- prood_app has no business with credentials, so it gets no access at all.
REVOKE ALL ON TABLE "user" FROM prood_app;
--> statement-breakpoint
REVOKE ALL ON TABLE "session" FROM prood_app;
--> statement-breakpoint
REVOKE ALL ON TABLE "account" FROM prood_app;
--> statement-breakpoint
REVOKE ALL ON TABLE "verification" FROM prood_app;
--> statement-breakpoint
REVOKE ALL ON TABLE "organization" FROM prood_app;
--> statement-breakpoint
REVOKE ALL ON TABLE "member" FROM prood_app;
--> statement-breakpoint
REVOKE ALL ON TABLE "invitation" FROM prood_app;
--> statement-breakpoint
REVOKE ALL ON TABLE "apikey" FROM prood_app;
--> statement-breakpoint
REVOKE ALL ON TABLE "agentHost" FROM prood_app;
--> statement-breakpoint
REVOKE ALL ON TABLE "agent" FROM prood_app;
--> statement-breakpoint
REVOKE ALL ON TABLE "agentCapabilityGrant" FROM prood_app;
--> statement-breakpoint
REVOKE ALL ON TABLE "approvalRequest" FROM prood_app;
--> statement-breakpoint
REVOKE ALL ON TABLE "tenant_domain" FROM prood_app;
--> statement-breakpoint
REVOKE ALL ON TABLE "integration_config" FROM prood_app;
