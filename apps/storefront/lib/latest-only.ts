/**
 * Run `save` one at a time, skipping straight to the newest value, so the last
 * choice is the last one the server hears however the requests would have raced.
 * Every caller settles with the outcome of the newest value.
 */
export function latestOnly<T>(save: (value: T) => Promise<void>): (value: T) => Promise<void> {
  let latest: T
  let running: Promise<void> | null = null

  async function drain(): Promise<void> {
    try {
      for (;;) {
        const value = latest
        try {
          await save(value)
          if (value === latest) return
        } catch (err) {
          if (value === latest) throw err
        }
      }
    } finally {
      running = null
    }
  }

  return (value) => {
    latest = value
    running ??= drain()
    return running
  }
}
