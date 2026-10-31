import 'server-only'
import { CommerceError, type CommerceErrorCode } from '@prood/types'

export function assertLimit(
  current: number,
  max: number | null,
  message: string,
  code: CommerceErrorCode = 'FORBIDDEN',
): void {
  if (max !== null && current >= max) {
    throw new CommerceError(message, code)
  }
}

export function assertFeature(enabled: boolean, message: string): void {
  if (!enabled) {
    throw new CommerceError(message, 'FORBIDDEN')
  }
}
