import { beforeEach, describe, expect, it } from 'vitest';
import { clearBaseClassDependenciesForComponent, clearBaseClassRegistry, findComponentPathsForBaseClassDependency, registerBaseClassDependency } from './base-class-registry';

beforeEach(() => {
  clearBaseClassRegistry();
});

describe('base-class-registry', () => {
  it('maps a base class file to every component depending on it', () => {
    registerBaseClassDependency('/src/base.ts', '/src/a.xd.component.ts');
    registerBaseClassDependency('/src/base.ts', '/src/b.xd.component.ts');
    registerBaseClassDependency('/src/base.ts', '/src/a.xd.component.ts');

    expect(findComponentPathsForBaseClassDependency('/src/base.ts')).toEqual(new Set(['/src/a.xd.component.ts', '/src/b.xd.component.ts']));
    expect(findComponentPathsForBaseClassDependency('/src/other.ts')).toBeUndefined();
  });

  it('clears the dependencies of a component, dropping base class files no longer depended on', () => {
    registerBaseClassDependency('/src/base.ts', '/src/a.xd.component.ts');
    registerBaseClassDependency('/src/barrel.ts', '/src/a.xd.component.ts');
    registerBaseClassDependency('/src/base.ts', '/src/b.xd.component.ts');

    clearBaseClassDependenciesForComponent('/src/a.xd.component.ts');

    expect(findComponentPathsForBaseClassDependency('/src/base.ts')).toEqual(new Set(['/src/b.xd.component.ts']));
    expect(findComponentPathsForBaseClassDependency('/src/barrel.ts')).toBeUndefined();
  });

  it('ignores components without registered dependencies', () => {
    registerBaseClassDependency('/src/base.ts', '/src/a.xd.component.ts');

    clearBaseClassDependenciesForComponent('/src/unknown.xd.component.ts');

    expect(findComponentPathsForBaseClassDependency('/src/base.ts')).toEqual(new Set(['/src/a.xd.component.ts']));
  });

  it('resets every mapping', () => {
    registerBaseClassDependency('/src/base.ts', '/src/a.xd.component.ts');

    clearBaseClassRegistry();

    expect(findComponentPathsForBaseClassDependency('/src/base.ts')).toBeUndefined();
  });
});
