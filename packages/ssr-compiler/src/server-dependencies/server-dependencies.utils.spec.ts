import type { CompilerCache, ComponentOrDirectiveMetadata } from '@xaendar/compiler';
import { describe, expect, it, vi } from 'vitest';
import { getServerDependencies } from './server-dependencies.utils';

/**
 * The metadata of a component or of a directive declared by a module.
 */
const declaration = (type: ComponentOrDirectiveMetadata['type'], selector: string, fileName: string) => ({
  type,
  selector,
  typescriptNodes: { klass: { getSourceFile: () => ({ fileName }) } }
}) as unknown as ComponentOrDirectiveMetadata;

const exportsByName: Record<string, ComponentOrDirectiveMetadata> = {
  Inside: declaration('component', 'x-inside', '/src/inside.ts'),
  Outside: declaration('component', 'x-outside', '/src/outside.ts'),
  Both: declaration('component', 'x-both', '/src/both.ts'),
  Waiting: declaration('component', 'x-waiting', '/src/waiting.ts'),
  Chart: Object.assign(declaration('component', 'x-chart', '/src/chart.ts'), { clientOnly: {} }),
  Tip: declaration('directive', 'tip', '/src/tip.ts'),
  Later: declaration('directive', 'later', '/src/later.ts'),
  Named: declaration('directive', 'x-inside', '/src/named.ts')
};

const cache = {
  getImport: vi.fn(async (imported: string, _local: string, _baseDir: string, path: string) => exportsByName[imported] ?? { type: 'symbol', modulePath: path, reactive: false })
} as unknown as CompilerCache;

/**
 * Keeps the modules a template imports, named as `/src/<name>.ts` after the exports of the modules above.
 */
const dependenciesOf = async (template: string, paths: string[]) => await getServerDependencies(template, paths.map(path => `/src/${path}.ts`), { templateDir: '/src', cache });

const IMPORTS = '@import { Inside } from \'./inside.ts\';\n@import { Outside } from \'./outside.ts\';\n@import { helper } from \'./helper.ts\';\n';

describe('getServerDependencies', () => {
  it('keeps every module of a template importing nothing rendering only in the browser', async () => {
    const paths = ['/src/inside.ts', '/src/helper.ts'];

    expect(await getServerDependencies(`${IMPORTS}<x-inside></x-inside>`, paths, { templateDir: '/src', cache })).toBe(paths);
  });

  it('leaves out the module of a component rendering only in the browser, with what the template does not render', async () => {
    const template = `@import { Chart } from './chart.ts';\n${IMPORTS}<x-chart></x-chart><x-outside></x-outside>`;

    expect(await dependenciesOf(template, ['chart', 'inside', 'outside', 'helper'])).toEqual(['/src/outside.ts']);
  });

  it('keeps every module of a template without a @client, without reading it', async () => {
    const paths = ['/src/inside.ts'];

    expect(await getServerDependencies('<x-inside></x-inside>', paths, { templateDir: '/src', cache })).toBe(paths);
    expect(cache.getImport).not.toHaveBeenCalled();
  });

  it('keeps every module of a template naming @client only in a text', async () => {
    const paths = ['/src/inside.ts'];

    expect(await getServerDependencies('<p>{ \'@client\' }</p><!-- @client -->', paths, { templateDir: '/src', cache })).toBe(paths);
  });

  it('keeps only the modules of what is rendered outside of the content of the blocks, the symbols being imported by the code', async () => {
    const template = `${IMPORTS}<x-outside></x-outside>@client { <x-inside></x-inside>{ helper() } }`;

    expect(await dependenciesOf(template, ['inside', 'outside', 'helper'])).toEqual(['/src/outside.ts']);
  });

  it('keeps the module of a component rendered both inside and outside of the content', async () => {
    const template = '@import { Both } from \'./both.ts\';\n<x-both></x-both>@client { <x-both></x-both> }';

    expect(await dependenciesOf(template, ['both'])).toEqual(['/src/both.ts']);
  });

  it('keeps the modules of what the placeholder renders, and of a @client nested in it, only for its placeholder', async () => {
    const template = [
      '@import { Waiting } from \'./waiting.ts\';',
      '@import { Inside } from \'./inside.ts\';',
      '@import { Outside } from \'./outside.ts\';',
      '@client { <x-inside></x-inside> } @placeholder { <x-waiting></x-waiting>@client { <x-inside></x-inside> } @placeholder { <x-outside></x-outside> } }'
    ].join('\n');

    expect(await dependenciesOf(template, ['inside', 'waiting', 'outside'])).toEqual(['/src/waiting.ts', '/src/outside.ts']);
  });

  it.each([
    ['an element', '<div><x-outside></x-outside></div>@client { }'],
    ['a @if', '@if (a) { <x-outside></x-outside> } @client { }'],
    ['a @else if', '@if (a) { } @else if (b) { <x-outside></x-outside> } @client { }'],
    ['a @else', '@if (a) { } @else { <x-outside></x-outside> } @client { }'],
    ['a @for', '@for (item of items; track item()) { <x-outside></x-outside> } @client { }'],
    ['a @case', '@switch (a) { @case (1) { <x-outside></x-outside> } } @client { }'],
    ['a template', '<template row()><x-outside></x-outside></template>@client { }'],
    ['a @hydrate', '@hydrate (idle) { <x-outside></x-outside> } @client { }'],
    ['a @try', '@try { <x-outside></x-outside> } @catch { } @client { }'],
    ['a @catch', '@try { } @catch (error) { <x-outside></x-outside> } @client { }']
  ])('finds what is rendered in %s', async (_case, template) => {
    expect(await dependenciesOf(`${IMPORTS}${template}`, ['inside', 'outside'])).toEqual(['/src/outside.ts']);
  });

  it.each([
    ['an element', '<div>@client { }</div>'],
    ['a @if', '@if (a) { @client { } }'],
    ['a @else', '@if (a) { } @else { @client { } }'],
    ['a @else if', '@if (a) { } @else if (b) { @client { } }'],
    ['a @for', '@for (item of items; track item()) { @client { } }'],
    ['a @case', '@switch (a) { @case (1) { @client { } } }'],
    ['a @hydrate', '@hydrate (idle) { @client { } }'],
    ['a @try', '@try { @client { } } @catch { }'],
    ['a @catch', '@try { } @catch { @client { } }']
  ])('finds a @client in %s', async (_case, template) => {
    expect(await dependenciesOf(`${IMPORTS}${template}`, ['inside'])).toEqual([]);
  });

  it('keeps the modules of the directives rendered outside of the content, however they are applied', async () => {
    const template = [
      '@import { Tip, Later } from \'./tip.ts\';',
      '<a @@tip></a><b *later></b>',
      '@client { }'
    ].join('\n');

    expect(await dependenciesOf(template, ['tip', 'later', 'inside'])).toEqual(['/src/tip.ts', '/src/later.ts']);
  });

  it('finds the directives of the branches of a conditional binding', async () => {
    const template = [
      '@import { Tip } from \'./tip.ts\';',
      '@import { Later } from \'./later.ts\';',
      '<a @if (b) { @@tip } @else { @if (c) { *later } }></a>',
      '@client { }'
    ].join('\n');

    expect(await dependenciesOf(template, ['tip', 'later'])).toEqual(['/src/tip.ts', '/src/later.ts']);
  });

  it('does not take a directive for the component named like it', async () => {
    const template = '@import { Named } from \'./named.ts\';\n<x-inside></x-inside>@client { }';

    expect(await dependenciesOf(template, ['named'])).toEqual([]);
  });
});
