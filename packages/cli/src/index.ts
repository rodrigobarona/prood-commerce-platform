#!/usr/bin/env node
import { execFileSync } from "node:child_process"
import { createCommerceApiClient, isCommerceApiError, unwrap } from "@prood/api-client"

type Flags = Record<string, string | boolean>

const SHORT_FLAG_ALIASES: Record<string, string> = {
  c: "check",
  h: "help",
  j: "json",
}

function parseArgs(argv: string[]) {
  const positionals: string[] = []
  const flags: Flags = {}
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]
    if (!arg) continue
    if (arg === "--") {
      positionals.push(...argv.slice(index + 1))
      break
    }
    if (arg.startsWith("--")) {
      const [rawKey, inlineValue] = arg.slice(2).split(/=(.*)/s, 2)
      const key = rawKey
      if (!key) continue
      if (inlineValue !== undefined) {
        flags[key] = inlineValue
        continue
      }
      const next = argv[index + 1]
      if (!next || next.startsWith("-")) {
        flags[key] = true
      } else {
        flags[key] = next
        index += 1
      }
      continue
    }
    if (arg.startsWith("-") && arg.length === 2) {
      const key = SHORT_FLAG_ALIASES[arg.slice(1)]
      if (key) {
        flags[key] = true
        continue
      }
    }
    if (!arg.startsWith("--")) {
      positionals.push(arg)
      continue
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

function mcpUrlFromApiUrl(apiUrl: string): string {
  const url = new URL(apiUrl)
  url.pathname = "/mcp"
  url.search = ""
  url.hash = ""
  return url.toString()
}

function commandExists(command: string): boolean {
  try {
    execFileSync(command, ["--version"], { stdio: "ignore" })
    return true
  } catch {
    return false
  }
}

function detectPackageManagerCommand(): { command: string; args: string[] } {
  const userAgent = process.env.npm_config_user_agent ?? ""
  const execPath = process.env.npm_execpath ?? ""
  const hint = `${userAgent} ${execPath}`.toLowerCase()

  if (hint.includes("pnpm")) return { command: "pnpm", args: ["openapi:check"] }
  if (hint.includes("yarn")) return { command: "yarn", args: ["openapi:check"] }
  if (hint.includes("npm")) return { command: "npm", args: ["run", "openapi:check"] }
  if (commandExists("pnpm")) return { command: "pnpm", args: ["openapi:check"] }

  throw new Error(
    "Could not determine a package manager for OpenAPI checks. Install pnpm or run `npm run openapi:check` / `yarn openapi:check` from the repository root."
  )
}

function runOpenApiCheck() {
  const { command, args } = detectPackageManagerCommand()
  if (!commandExists(command)) {
    throw new Error(
      `Package manager '${command}' was detected but is not available on PATH. Install it or run the repository OpenAPI check with npm/yarn directly.`
    )
  }
  execFileSync(command, args, { stdio: "inherit" })
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
    const headers: Record<string, string> = {}
    const apiKey = stringFlag(flags, "api-key")
    const bearerToken = stringFlag(flags, "bearer-token")
    if (apiKey) headers["x-api-key"] = apiKey
    if (bearerToken) headers.Authorization = `Bearer ${bearerToken}`
    print(
      {
        mcpServers: {
          "prood-commerce": {
            url: mcpUrlFromApiUrl(apiUrl),
            headers: Object.keys(headers).length > 0 ? headers : undefined,
          },
        },
      },
      flags
    )
    return
  }

  if (resource === "openapi" && command === "sync" && flags.check) {
    runOpenApiCheck()
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
