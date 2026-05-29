import { getAuth } from "@/lib/auth/server"

/** Agent Auth Protocol discovery document (§2). */
export async function GET(request: Request) {
  const configuration = await getAuth().api.getAgentConfiguration({
    headers: request.headers,
  })
  return Response.json(configuration)
}
