import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    name: 'payment-ifthenpay',
    include: ['src/**/*.test.ts'],
    environment: 'node',
    clearMocks: true,
    restoreMocks: true,
    unstubGlobals: true,
  },
})
