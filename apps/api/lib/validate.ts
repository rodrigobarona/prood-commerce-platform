import "server-only"
import { CommerceError } from "@prood/types"
import type { z } from "zod"

/** An empty body is fine for a schema of optional fields. Anything else has to be JSON. */
async function readJson(req: Request): Promise<unknown> {
  const text = await req.text()
  if (!text.trim()) return {}
  try {
    return JSON.parse(text)
  } catch {
    throw new CommerceError(
      "We couldn't read this request. The body isn't valid JSON. Fix it and send it again.",
      "VALIDATION",
      400
    )
  }
}

/** Parse and validate a JSON request body against a Zod schema (throws ZodError → 422). */
export async function readBody<T extends z.ZodType>(
  req: Request,
  schema: T
): Promise<z.infer<T>> {
  return schema.parse(await readJson(req))
}

/** Parse and validate URL search params against a Zod schema (throws ZodError → 422). */
export function readQuery<T extends z.ZodType>(req: Request, schema: T): z.infer<T> {
  const params = Object.fromEntries(new URL(req.url).searchParams.entries())
  return schema.parse(params)
}
