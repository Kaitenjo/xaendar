import type { ResolvedConfig } from 'vite';
import { describe, expect, it } from 'vitest';
import type { XaendarPluginState } from '../../types/plugin.types';
import { createConfigResolvedHook } from './config-resolved';

function resolve(command: 'build' | 'serve', cssMinify: ResolvedConfig['build']['cssMinify']): boolean {
  const state = { minifyStyles: false } as XaendarPluginState;
  createConfigResolvedHook(state)({ command, build: { cssMinify } } as ResolvedConfig);
  return state.minifyStyles;
}

describe('createConfigResolvedHook()', () => {
  it('enables style minification in a build with CSS minification on', () => {
    expect(resolve('build', 'lightningcss')).toBe(true);
    expect(resolve('build', true)).toBe(true);
  });

  it('keeps it disabled when CSS minification is turned off', () => {
    expect(resolve('build', false)).toBe(false);
  });

  it('keeps it disabled in dev', () => {
    expect(resolve('serve', 'lightningcss')).toBe(false);
  });
});
