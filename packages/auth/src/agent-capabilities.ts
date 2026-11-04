/**
 * Whether a capability changes the store: an admin operation that isn't a read.
 * Approving one of these needs a recent sign-in, so an unattended session can't
 * hand an agent refunds, cancellations or price changes.
 *
 * Capabilities are OpenAPI `operationId`s; apps/api tests this rule against the
 * spec's HTTP methods so a new operation can't slip past it.
 */
export function changesStore(capability: string): boolean {
  return capability.startsWith("admin") && !/^admin(Get|List)[A-Z]/.test(capability)
}

/** How recent a sign-in has to be to approve capabilities that change the store. */
export const FRESH_SIGN_IN_SECONDS = 10 * 60

/** Whether a session started recently enough to approve store changes. */
export function isFreshSignIn(sessionCreatedAt: Date, now = new Date()): boolean {
  return now.getTime() - sessionCreatedAt.getTime() <= FRESH_SIGN_IN_SECONDS * 1000
}
