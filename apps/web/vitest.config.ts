import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/**/*.test.{ts,tsx}'],
    exclude: ['dist/**', 'dist-ts/**', 'node_modules/**'],
    minWorkers: 1,
    maxWorkers: 1,
    pool: 'forks',
    setupFiles: ['./src/test-setup.ts'],
  },
});
