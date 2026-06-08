#!/usr/bin/env tsx
import { execFileSync } from "node:child_process"
import { createCommerceApiClient, isCommerceApiError, unwrap } from "@prood/api-client"

type Flags = Record<string, string | boolean>

function parseArgs(argv: string[]) {
  const positionals: string[] = []
  const flags: Flags = {}
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]
    if (!arg) continue
    if (!arg.startsWith("--")) {
      positionals.push(arg)
      continue
    }
    const key = arg.slice(2)
    const next = argv[index + 1]
    if (!next || next.startsWith("--")) {
      flags[key] = true
    } else {
      flags[key] = next
      index += 1
    }
  }
  return { positionals, flags }
}

function help() {
  console.log(`prood <resource> <command> [options]

Resources:
  auth whoami        Resolve current API caller
  products list     List storefront products
  orders list       List customer orders
  mcp config        Print MCP client configuration
  openapi sync      Run OpenAPI drift check

Options:
  --api-url <url>        Commerce API base URL including /v1
  --api-key <key>        Organization API key
  --bearer-token <jwt>   Agent Auth Bearer token
  --json                 Print machine-readable JSON
  --help                 Show help

Examples:
  prood auth whoami --api-url http://localhost:3005/v1 --api-key pk_xxx --json
  prood products list --api-url http://localhost:3005/v1 --api-key pk_xxx --json
  prood orders list --api-url http://localhost:3005/v1 --api-key pk_xxx --json
  prood mcp config --api-url http://localhost:3005/v1 --api-key pk_xxx
  prood openapi sync --check`)
}

function stringFlag(flags: Flags, name: string): string | undefined {
  const value = flags[name]
  return typeof value === "string" ? value : undefined
}

function api(flags: Flags) {
  const baseUrl = stringFlag(flags, "api-url") ?? process.env.COMMERCE_API_URL
  if (!baseUrl) {
    throw new Error("Missing --api-url <url> or COMMERCE_API_URL")
  }
  return createCommerceApiClient({
    baseUrl,
    apiKey: stringFlag(flags, "api-key") ?? process.env.PROOD_API_KEY,
    bearerToken: stringFlag(flags, "bearer-token") ?? process.env.PROOD_BEARER_TOKEN,
  })
}

function print(data: unknown, flags: Flags) {
  if (flags.json) {
    console.log(JSON.stringify(data, null, 2))
  } else if (typeof data === "string") {
    console.log(data)
  } else {
    console.log(JSON.stringify(data, null, 2))
  }
}

async function main() {
  const { positionals, flags } = parseArgs(process.argv.slice(2))
  const [resource, command] = positionals
  if (!resource || flags.help) {
    help()
    return
  }

  if (resource === "auth" && command === "whoami") {
    print(await unwrap(api(flags).GET("/me")), flags)
    return
  }

  if (resource === "products" && command === "list") {
    print(await unwrap(api(flags).GET("/products")), flags)
    return
  }

  if (resource === "orders" && command === "list") {
    print(await unwrap(api(flags).GET("/orders")), flags)
    return
  }

  if (resource === "mcp" && command === "config") {
    const apiUrl = stringFlag(flags, "api-url") ?? process.env.COMMERCE_API_URL
    if (!apiUrl) throw new Error("Missing --api-url <url> or COMMERCE_API_URL")
    const url = apiUrl.replace(/\/v1\/?$/, "/mcp")
    print(
      {
        mcpServers: {
          "prood-commerce": {
            url,
            headers: stringFlag(flags, "api-key")
              ? { "x-api-key": stringFlag(flags, "api-key") }
              : undefined,
          },
        },
      },
      { ...flags, json: true }
    )
    return
  }

  if (resource === "openapi" && command === "sync" && flags.check) {
    execFileSync("pnpm", ["openapi:check"], { stdio: "inherit" })
    return
  }

  throw new Error(`Unknown command: ${[resource, command].filter(Boolean).join(" ")}`)
}

main().catch((error: unknown) => {
  if (isCommerceApiError(error)) {
    console.error(`${error.code}: ${error.message}`)
  } else {
    console.error(error instanceof Error ? error.message : String(error))
  }
  process.exit(1)
})
