import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./src/test/setup.ts'],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/e2e/**',
      '**/*.spec.ts',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.test.{ts,tsx}',
        '**/*.spec.{ts,tsx}',
        '**/*.config.ts',
        '**/types.ts',
        '**/*.d.ts',
      ],
      thresholds: {
        global: {
          statements: 80,
          branches: 80,
          functions: 65,  // Lower for React inline handlers (see docs/TEST_COVERAGE_STANDARDS.md)
          lines: 80,
        },
        // Higher standards for utility functions (pure logic)
        'src/utils/**/*.ts': {
          statements: 90,
          branches: 90,
          functions: 85,
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
})
