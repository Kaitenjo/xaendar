import { defineConfig } from 'vitest/config';
import getVitestConfig from '../../vitest-config.js';

export default defineConfig(getVitestConfig(import.meta.dirname, {
  coverage: {
    include: ['src/lib/plugin/**/*.ts'],
    exclude: ['src/lib/plugin/**/*.spec.ts'],
    thresholds: {
      lines: 100,
      functions: 100,
      branches: 100,
      statements: 100
    }
  }
}));
