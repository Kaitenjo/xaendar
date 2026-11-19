import { beforeEach, describe, expect, it } from 'vitest';
import { clearDependenciesForComponent, clearDependencyRegistry, findComponentPathsForDependency, registerDependency } from './dependency-registry';

beforeEach(() => {
  clearDependencyRegistry();
});

describe('dependency-registry', () => {
  it('maps a file to every component depending on it', () => {
    registerDependency('/src/base.ts', '/src/a.xd.component.ts');
    registerDependency('/src/base.ts', '/src/b.xd.component.ts');
    registerDependency('/src/base.ts', '/src/a.xd.component.ts');

    expect(findComponentPathsForDependency('/src/base.ts')).toEqual(new Set(['/src/a.xd.component.ts', '/src/b.xd.component.ts']));
    expect(findComponentPathsForDependency('/src/other.ts')).toBeUndefined();
  });

  it('clears the dependencies of a component, dropping files no longer depended on', () => {
    registerDependency('/src/base.ts', '/src/a.xd.component.ts');
    registerDependency('/src/barrel.ts', '/src/a.xd.component.ts');
    registerDependency('/src/base.ts', '/src/b.xd.component.ts');

    clearDependenciesForComponent('/src/a.xd.component.ts');

    expect(findComponentPathsForDependency('/src/base.ts')).toEqual(new Set(['/src/b.xd.component.ts']));
    expect(findComponentPathsForDependency('/src/barrel.ts')).toBeUndefined();
  });

  it('ignores components without registered dependencies', () => {
    registerDependency('/src/base.ts', '/src/a.xd.component.ts');

    clearDependenciesForComponent('/src/unknown.xd.component.ts');

    expect(findComponentPathsForDependency('/src/base.ts')).toEqual(new Set(['/src/a.xd.component.ts']));
  });

  it('resets every mapping', () => {
    registerDependency('/src/base.ts', '/src/a.xd.component.ts');

    clearDependencyRegistry();

    expect(findComponentPathsForDependency('/src/base.ts')).toBeUndefined();
  });
});
