import { resolve } from 'node:path';
import type { UserConfig } from 'vitest/config';

/**
 * `@xaendar/*` packages that can be aliased to their source entry point in tests.
 */
const XAENDAR_PACKAGES = ['build-tools', 'common', 'compiler', 'core', 'language-core', 'signals', 'types'];

/**
 * Coverage overrides used to extend the shared Vitest config.
 */
export type VitestCoverageOptions = {
  include?: string[],
  exclude?: string[],
  thresholds?: {
    lines?: number,
    functions?: number,
    branches?: number,
    statements?: number,
  },
}

/**
 * Options used to extend the shared Vitest config.
 */
export type VitestConfigOptions = {
  coverage?: VitestCoverageOptions,
}

/**
 * Builds the standard Vitest configuration for Xaendar packages.
 *
 * @param dirName Absolute path of the package directory.
 * @param options Optional coverage overrides.
 * @returns A reusable Vitest user configuration.
 */
export default function getVitestConfig(dirName: string, options?: VitestConfigOptions): UserConfig {
  const repoRoot = resolve(dirName, '../..');

  return {
    root: dirName,
    resolve: {
      alias: XAENDAR_PACKAGES.reduce<Record<string, string>>((acc, pkg) => {
        acc[`@xaendar/${pkg}`] = resolve(repoRoot, `packages/${pkg}/src/public-api.ts`);
        return acc;
      }, {})
    },
    test: {
      environment: 'node',
      include: ['src/**/*.spec.ts'],
      coverage: {
        provider: 'v8',
        reporter: ['text'],
        include: options?.coverage?.include ?? ['src/**/*.ts'],
        exclude: options?.coverage?.exclude ?? ['src/**/*.spec.ts'],
        thresholds: options?.coverage?.thresholds
      }
    }
  };
}
