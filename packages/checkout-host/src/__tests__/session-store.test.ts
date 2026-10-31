import { beforeEach, describe, expect, it, vi } from 'vitest'

const store = vi.hoisted(() => new Map<string, string>())

vi.mock('server-only', () => ({}))
vi.mock('@upstash/redis', () => ({
  Redis: class {
    async set(key: string, value: string, options: { nx?: boolean }) {
      if (options.nx && store.has(key)) return null
      store.set(key, value)
      return 'OK'
    }
    async eval(_script: string, keys: string[], args: string[]) {
      const [key = ''] = keys
      if (store.get(key) !== args[0]) return 0
      store.delete(key)
      return 1
    }
  },
}))

import { lockSession, unlockSession } from '../session-store'

beforeEach(() => {
  store.clear()
  vi.stubEnv('KV_REST_API_URL', 'https://kv.example')
  vi.stubEnv('KV_REST_API_TOKEN', 'token')
})

describe('session lock', () => {
  it('lets one caller hold a session at a time', async () => {
    const first = await lockSession('s1')
    expect(first).toBeTruthy()
    await expect(lockSession('s1')).resolves.toBeNull()
    await expect(lockSession('s2')).resolves.toBeTruthy()
  })

  it('can be taken again once released', async () => {
    const token = await lockSession('s1')
    await unlockSession('s1', token!)
    await expect(lockSession('s1')).resolves.toBeTruthy()
  })

  it("can't be released by a caller whose lock expired", async () => {
    await lockSession('s1')
    await unlockSession('s1', 'someone-elses-token')
    await expect(lockSession('s1')).resolves.toBeNull()
  })
})
