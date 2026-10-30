// ---------------------------------------------------------------------------
// Constant-time string comparison for shared secrets
// ---------------------------------------------------------------------------
// Runtime-agnostic (no node:crypto) so it is safe to re-export from this
// package, which is also imported by client components.

/** Compare two secrets without leaking where they differ through timing. */
export function safeEqual(a: string, b: string): boolean {
  let diff = a.length ^ b.length
  const length = Math.max(a.length, b.length)
  for (let i = 0; i < length; i++) {
    diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0)
  }
  return diff === 0
}
