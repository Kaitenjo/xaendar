import { beforeEach, describe, expect, it } from 'vitest';
import { clearStyleDependenciesForComponent, clearStyleRegistry, findComponentPathsForStyleDependency, registerStyleDependency } from './style-registry';

beforeEach(() => {
  clearStyleRegistry();
});

describe('style-registry', () => {
  it('maps a style file to every component depending on it', () => {
    registerStyleDependency('/src/shared.css', '/src/a.xd.component.ts');
    registerStyleDependency('/src/shared.css', '/src/b.xd.component.ts');
    registerStyleDependency('/src/shared.css', '/src/a.xd.component.ts');

    expect(findComponentPathsForStyleDependency('/src/shared.css')).toEqual(new Set(['/src/a.xd.component.ts', '/src/b.xd.component.ts']));
    expect(findComponentPathsForStyleDependency('/src/other.css')).toBeUndefined();
  });

  it('clears the style dependencies of a component, dropping files no longer depended on', () => {
    registerStyleDependency('/src/shared.css', '/src/a.xd.component.ts');
    registerStyleDependency('/src/a.css', '/src/a.xd.component.ts');
    registerStyleDependency('/src/shared.css', '/src/b.xd.component.ts');

    clearStyleDependenciesForComponent('/src/a.xd.component.ts');

    expect(findComponentPathsForStyleDependency('/src/shared.css')).toEqual(new Set(['/src/b.xd.component.ts']));
    expect(findComponentPathsForStyleDependency('/src/a.css')).toBeUndefined();
  });

  it('ignores components without registered style dependencies', () => {
    registerStyleDependency('/src/shared.css', '/src/a.xd.component.ts');

    clearStyleDependenciesForComponent('/src/unknown.xd.component.ts');

    expect(findComponentPathsForStyleDependency('/src/shared.css')).toEqual(new Set(['/src/a.xd.component.ts']));
  });

  it('resets every mapping', () => {
    registerStyleDependency('/src/shared.css', '/src/a.xd.component.ts');

    clearStyleRegistry();

    expect(findComponentPathsForStyleDependency('/src/shared.css')).toBeUndefined();
  });
});
