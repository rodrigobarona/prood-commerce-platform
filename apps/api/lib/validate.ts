import "server-only"
import type { z } from "zod"

/** Parse and validate a JSON request body against a Zod schema (throws ZodError → 422). */
export async function readBody<T extends z.ZodType>(
  req: Request,
  schema: T
): Promise<z.infer<T>> {
  const json = await req.json().catch(() => ({}))
  return schema.parse(json)
}

/** Parse and validate URL search params against a Zod schema (throws ZodError → 422). */
export function readQuery<T extends z.ZodType>(req: Request, schema: T): z.infer<T> {
  const params = Object.fromEntries(new URL(req.url).searchParams.entries())
  return schema.parse(params)
}
