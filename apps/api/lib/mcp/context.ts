import { AsyncLocalStorage } from "node:async_hooks"
import type { ApiCaller } from "@/lib/auth-tenant"

export const mcpCallerStorage = new AsyncLocalStorage<ApiCaller>()

export function getMcpCaller(): ApiCaller {
  const caller = mcpCallerStorage.getStore()
  if (!caller) {
    throw new Error("MCP caller context is missing")
  }
  return caller
}
