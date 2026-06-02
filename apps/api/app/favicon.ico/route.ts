import { connection } from "next/server"

export async function GET() {
  await connection()
  return new Response(null, {
    status: 204,
    headers: { "cache-control": "public, max-age=604800, immutable" },
  })
}
