import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Standard exclusions
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
    ],
    // Set timeout for network requests
    testTimeout: 30000,
  },
});