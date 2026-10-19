import type { MinimalPluginContextWithoutEnvironment, ResolvedConfig } from 'vite';
import { describe, expect, it } from 'vitest';
import type { XaendarPluginState } from '../../types/plugin.types';
import { createConfigResolvedHook } from './config-resolved';

function resolveState(command: 'build' | 'serve', cssMinify: ResolvedConfig['build']['cssMinify']): XaendarPluginState {
  const state = { minifyStyles: false, isBuild: false } as XaendarPluginState;
  createConfigResolvedHook(state).call({} as MinimalPluginContextWithoutEnvironment, { command, build: { cssMinify } } as ResolvedConfig);
  return state;
}

function resolve(command: 'build' | 'serve', cssMinify: ResolvedConfig['build']['cssMinify']): boolean {
  return resolveState(command, cssMinify).minifyStyles;
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

  it('records whether the plugin runs in a build', () => {
    expect(resolveState('build', false).isBuild).toBe(true);
    expect(resolveState('serve', 'lightningcss').isBuild).toBe(false);
  });
});
