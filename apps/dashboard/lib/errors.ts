/**
 * Returns true if the error is a Next.js framework error (redirect, notFound, etc.)
 * that must be re-thrown to preserve framework behavior.
 */
export function isNextInternalError(error: unknown): boolean {
  return error instanceof Error && "digest" in error
}
