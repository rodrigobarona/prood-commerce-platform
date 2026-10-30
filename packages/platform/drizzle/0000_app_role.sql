-- Tenant role. withTenant() runs `SET LOCAL ROLE prood_app` after setting
-- app.current_org_id, so tenant-scoped queries are bound by the
-- tenant_isolation policies even though the connecting role has BYPASSRLS.
-- Roles are cluster-wide (other databases on the same server may already
-- have created it), hence the existence check.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'prood_app') THEN
    CREATE ROLE prood_app NOLOGIN NOBYPASSRLS;
  END IF;
END
$$;
--> statement-breakpoint
-- The connecting role may switch to prood_app but does not inherit its grants.
GRANT prood_app TO CURRENT_USER WITH INHERIT FALSE, SET TRUE;
--> statement-breakpoint
GRANT USAGE ON SCHEMA public TO prood_app;
--> statement-breakpoint
-- Tables and sequences created by later migrations (run as this role) get
-- DML grants automatically.
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO prood_app;
--> statement-breakpoint
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO prood_app;
