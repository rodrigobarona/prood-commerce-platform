-- DNS instructions for custom domain setup (TXT/CNAME/A rows shown in dashboard).
ALTER TABLE "tenant_domain" ADD COLUMN IF NOT EXISTS "dns_records" jsonb NOT NULL DEFAULT '[]';
