import { warnWithoutSharedLimits } from "@prood/auth/rate-limit-storage"

export function register() {
  warnWithoutSharedLimits()
}
