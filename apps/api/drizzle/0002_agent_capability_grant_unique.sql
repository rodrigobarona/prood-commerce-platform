-- Deduplicate existing agentCapabilityGrant rows before enforcing uniqueness.
-- Keeps the most-recently updated row per (agent_id, capability); ctid breaks ties.
DELETE FROM "agentCapabilityGrant" a
USING "agentCapabilityGrant" b
WHERE a.agent_id = b.agent_id
  AND a.capability = b.capability
  AND (a.updated_at < b.updated_at
       OR (a.updated_at = b.updated_at AND a.ctid < b.ctid));
--> statement-breakpoint
CREATE UNIQUE INDEX "agentCapabilityGrant_agent_id_capability_unique" ON "agentCapabilityGrant" USING btree ("agent_id","capability");
