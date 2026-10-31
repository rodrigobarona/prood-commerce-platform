import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    name: 'payment-stripe',
    include: ['src/**/*.test.ts'],
    environment: 'node',
    clearMocks: true,
    restoreMocks: true,
    unstubGlobals: true,
  },
})
