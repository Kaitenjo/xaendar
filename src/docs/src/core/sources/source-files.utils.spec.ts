import { describe, expect, it } from 'vitest';
import { collectFolder, langOf } from './source-files.utils';

describe('langOf', () => {
  it.each([
    ['a.xd.component.ts', 'ts'],
    ['a.js', 'ts'],
    ['a.mjs', 'ts'],
    ['a.xd.component.html', 'html'],
    ['a.CSS', 'css'],
    ['tsconfig.json', 'json'],
    ['setup.sh', 'bash'],
    ['notes.txt', 'text'],
    ['Makefile', 'text']
  ])('infers the language of %s', (fileName, lang) => {
    expect(langOf(fileName)).toBe(lang);
  });
});

describe('collectFolder', () => {
  const registry = {
    '../examples/a/counter/counter.xd.component.html': 'html',
    '../examples/a/counter/counter.xd.component.ts': 'ts',
    '../examples/a/counter/counter.css': 'css',
    '../examples/a/counter/badge.xd.component.ts': 'badge ts',
    '../examples/a/counter/badge.xd.component.html': 'badge html',
    '../examples/a/counter/counter.spec.ts': 'spec',
    '../examples/a/counter/store.ts': 'store',
    '../examples/a/counter-other/counter-other.xd.component.ts': 'other'
  };

  it('collects the files of the folder only', () => {
    const names = collectFolder(registry, '../examples/a/counter').map(file => file.name);
    expect(names).not.toContain('counter-other.xd.component.ts');
    expect(names).not.toContain('counter.spec.ts');
  });

  it('puts the component named after the folder first, class then template then style', () => {
    expect(collectFolder(registry, '../examples/a/counter').map(file => file.name)).toEqual([
      'counter.xd.component.ts',
      'counter.xd.component.html',
      'counter.css',
      'badge.xd.component.ts',
      'badge.xd.component.html',
      'store.ts'
    ]);
  });

  it('keeps the content and infers the language', () => {
    expect(collectFolder(registry, '../examples/a/counter')[1]).toEqual({ name: 'counter.xd.component.html', lang: 'html', code: 'html' });
  });

  it('collects sub folders, named relatively to the folder', () => {
    const files = collectFolder({ '../x/main/child/child.xd.component.ts': 'c', '../x/main/main.xd.component.ts': 'm' }, '../x/main');
    expect(files.map(file => file.name)).toEqual(['main.xd.component.ts', 'child/child.xd.component.ts']);
  });

  it('returns nothing for an unknown folder', () => {
    expect(collectFolder(registry, '../examples/nope')).toEqual([]);
  });
});
