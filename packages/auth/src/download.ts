/**
 * A JSON file as a download. Streamed one section at a time, so a large store
 * isn't held as one string and isn't capped by a serverless response limit.
 */
export function jsonDownload(filename: string, sections: Record<string, unknown>): Response {
  const encoder = new TextEncoder()
  const entries = Object.entries(sections)
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(encoder.encode(`{\n  "exportedAt": ${JSON.stringify(new Date().toISOString())}`))
      for (const [key, value] of entries) {
        controller.enqueue(encoder.encode(`,\n  ${JSON.stringify(key)}: ${JSON.stringify(value, null, 2)}`))
      }
      controller.enqueue(encoder.encode("\n}\n"))
      controller.close()
    },
  })
  return new Response(stream, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  })
}
