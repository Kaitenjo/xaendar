import { mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import type { CompilerOptions } from 'typescript';
import type { XaendarPluginState } from '../../types/xaendar-plugin-state.type';

vi.mock('@xaendar/language-core', async importOriginal => ({
  ...await importOriginal<typeof import('@xaendar/language-core')>(),
  getLanguageService: vi.fn()
}));

import { getLanguageService } from '@xaendar/language-core';
import { createProgram, ModuleKind, ModuleResolutionKind, ScriptTarget } from 'typescript';
import { toPosixPath } from '../path/path.utils';
import { describeStaticComponents, findStaticComponents } from './static-components.utils';

const COMPILER_OPTIONS: CompilerOptions = { target: ScriptTarget.ESNext, module: ModuleKind.ESNext, moduleResolution: ModuleResolutionKind.Bundler, skipLibCheck: true, noEmit: true };

let root: string;
let counter = 0;

beforeAll(() => {
  root = toPosixPath(realpathSync.native(mkdtempSync(join(tmpdir(), 'xaendar-static-'))));
});

afterAll(() => {
  rmSync(root, { recursive: true, force: true });
});

/**
 * The source of a component, its template in the file named after it.
 */
const component = (name: string, body = '', header = '', options = ''): string => [
  'import { CustomElement, Property, WebComponent } from \'@xaendar/core\';',
  header,
  `@WebComponent({ selector: 'x-${name}', ${options} templateUrl: './${name}.html' })`,
  `export class ${name} extends CustomElement {`,
  body,
  '}'
].join('\n');

/**
 * Writes a project and analyzes it.
 *
 * @param files - The content of the files, by their path relative to the project.
 * @param ssrEntry - The entry of the server.
 * @param outside - The files outside of the project.
 */
async function analyze(files: Record<string, string>, ssrEntry = 'entry-server', outside: readonly string[] = []) {
  const dir = `${root}/case-${counter++}`;
  const fileNames = new Array<string>();
  for (const [path, content] of Object.entries(files)) {
    mkdirSync(dirname(`${dir}/${path}`), { recursive: true });
    writeFileSync(`${dir}/${path}`, content);
    if (path.endsWith('.ts') && !outside.includes(path)) {
      fileNames.push(`${dir}/${path}`);
    }
  }

  vi.mocked(getLanguageService).mockReturnValue({ getProgram: () => createProgram(fileNames, COMPILER_OPTIONS) } as never);
  const logInfo = vi.fn();
  const state = {
    compilerOptions: COMPILER_OPTIONS,
    projectFileNames: fileNames,
    root: dir,
    ssr: { entry: ssrEntry },
    host: { readFile: (path: string) => { try { return readFileSync(path, 'utf8'); } catch { return undefined; } } },
    logInfo
  } as unknown as XaendarPluginState;
  return { dir, result: await findStaticComponents(state) };
}

/**
 * A template importing components, by the names of their classes.
 */
const importing = (...names: string[]): string => names.map(name => `@import { ${name} } from './${name}.xd.component.ts'`).join('\n');

describe('findStaticComponents', () => {
  it('finds the components without logic, compiling their module to the modules they render', async () => {
    const { dir, result } = await analyze({
      'root.xd.component.ts': component('root'),
      'root.html': `${importing('card')}\n<x-card />`,
      'card.xd.component.ts': component('card'),
      'card.html': '<p>card</p>'
    });

    expect(result.statics).toEqual(['x-root', 'x-card']);
    expect(result.interactive.size).toBe(0);
    expect(result.modules).toEqual(new Map([[`${dir}/root.xd.component.ts`, [`${dir}/card.xd.component.ts`]], [`${dir}/card.xd.component.ts`, []]]));
    expect(result.islands.size).toBe(0);
  });

  it('imports a module once, whatever the components rendering it', async () => {
    const { dir, result } = await analyze({
      'root.xd.component.ts': component('root'),
      'root.html': `${importing('twin')}\n<x-twin />\n<x-twin />`,
      'twin.xd.component.ts': component('twin'),
      'twin.html': ''
    });

    expect(result.modules.get(`${dir}/root.xd.component.ts`)).toEqual([`${dir}/twin.xd.component.ts`]);
  });

  it('keeps a component with logic in its class, in its template or in its module', async () => {
    const { result } = await analyze({
      'klass.xd.component.ts': component('klass', 'public onInit(): void { }'),
      'klass.html': '',
      'view.xd.component.ts': component('view'),
      'view.html': '<p (click)="a()"></p>',
      'polyfilled.xd.component.ts': component('polyfilled', '', 'import \'./polyfill\';'),
      'polyfilled.html': ''
    });

    expect(result.interactive).toEqual(new Map([
      ['x-klass', 'declares onInit'],
      ['x-view', 'listens to (click)'],
      ['x-polyfilled', 'imports \'./polyfill\' for its effects']
    ]));
    expect(result.modules.size).toBe(0);
  });

  it('keeps a component whose module the code reads something from, with what it renders, unless the code is the server or a spec', async () => {
    const { result } = await analyze({
      'used.xd.component.ts': component('used'),
      'used.html': `${importing('leaf')}\n<x-leaf />`,
      'free.xd.component.ts': component('free'),
      'free.html': `${importing('stone')}\n<x-stone />`,
      'leaf.xd.component.ts': component('leaf'),
      'leaf.html': '',
      'stone.xd.component.ts': component('stone'),
      'stone.html': '',
      'bootstrap.ts': 'import \'./free.xd.component\';\nimport { used } from \'./used.xd.component\';\nconsole.log(used);',
      'entry-server.ts': 'const { free } = await import(\'./free.xd.component\');\nexport { free };',
      'free.spec.ts': 'import { free } from \'./free.xd.component\';\nconsole.log(free);'
    });

    expect(result.statics).toEqual(['x-free', 'x-stone']);
    expect(result.interactive).toEqual(new Map([
      ['x-used', 'its module is imported by code'],
      ['x-leaf', '<x-used> may create it in the browser']
    ]));
  });

  it('accepts an absolute entry of the server, and one with its extension', async () => {
    const dir = `${root}/case-${counter}`;
    const { result } = await analyze({
      'free.xd.component.ts': component('free'),
      'free.html': '',
      'entry-server.ts': 'export { free } from \'./free.xd.component\';'
    }, `${dir}/entry-server.ts`);

    expect(result.statics).toEqual(['x-free']);
  });

  it('keeps a component an interactive one binds to a signal, not one it binds to a value', async () => {
    const { result } = await analyze({
      'root.xd.component.ts': component('root', 'public a(): string { return \'\'; }\npublic onInit(): void { }'),
      'root.html': `${importing('bound', 'fixed')}\n<x-bound label="{ a() }" /><x-fixed label="a" />`,
      'bound.xd.component.ts': component('bound', '@Property(\'\') public accessor label!: () => string;'),
      'bound.html': '{ label() }',
      'fixed.xd.component.ts': component('fixed', '@Property(\'\') public accessor label!: () => string;'),
      'fixed.html': '{ label() }'
    });

    expect(result.statics).toEqual(['x-fixed']);
    expect(result.interactive.get('x-bound')).toBe('<x-root> binds a signal to one of its inputs');
  });

  it('keeps a component an interactive one renders in a block the browser renders again, and what it renders in turn', async () => {
    const { result } = await analyze({
      'root.xd.component.ts': component('root', 'public onInit(): void { }'),
      'root.html': `${importing('page')}\n@if (open()) { <x-page /> }`,
      'page.xd.component.ts': component('page'),
      'page.html': `${importing('widget')}\n<x-widget />`,
      'widget.xd.component.ts': component('widget', 'public onInit(): void { }'),
      'widget.html': `${importing('chip')}\n<x-chip label="a" />`,
      'chip.xd.component.ts': component('chip', '@Property(\'\') public accessor label!: () => string;'),
      'chip.html': '{ label() }'
    });

    expect(result.statics).toEqual([]);
    expect(result.interactive).toEqual(new Map([
      ['x-root', 'declares onInit'],
      ['x-page', '<x-root> may create it in the browser'],
      ['x-widget', 'declares onInit'],
      ['x-chip', '<x-widget> may create it in the browser']
    ]));
  });

  it('lets a static component render an interactive one, whose inputs can be written into the HTML', async () => {
    const { dir, result } = await analyze({
      'root.xd.component.ts': component('root', '@Property(0) public accessor size!: () => number;'),
      'root.html': `${importing('counter')}\n<x-counter start="{ size() }" />`,
      'counter.xd.component.ts': component('counter', '@Property(0) public accessor start!: () => number;\npublic onInit(): void { }'),
      'counter.html': '{ start() }'
    });

    expect(result.statics).toEqual(['x-root']);
    expect(result.islands).toEqual(new Map([[`${dir}/root.html`, new Set(['x-counter'])]]));
    expect(result.modules.get(`${dir}/root.xd.component.ts`)).toEqual([`${dir}/counter.xd.component.ts`]);
  });

  it('keeps a static component passing an input that cannot be written into the HTML to an interactive one', async () => {
    const { result } = await analyze({
      'root.xd.component.ts': component('root', 'public format = (): number => 1;'),
      'root.html': `${importing('button')}\n<x-button start="{ format }" />`,
      'button.xd.component.ts': component('button', '@Property(undefined) public accessor start!: () => () => number;\npublic onInit(): void { }'),
      'button.html': ''
    });

    expect(result.statics).toEqual([]);
    expect(result.interactive.get('x-root')).toBe('passes to <x-button> the input start, which cannot be written into the HTML');
  });

  it('lets a static component pass anything to a static one', async () => {
    const { result } = await analyze({
      'root.xd.component.ts': component('root', 'public format = (): number => 1;'),
      'root.html': `${importing('tile')}\n<x-tile start="{ format }" />`,
      'tile.xd.component.ts': component('tile', '@Property(undefined) public accessor start!: () => () => number;'),
      'tile.html': ''
    });

    expect(result.statics).toEqual(['x-root', 'x-tile']);
  });

  it('ignores what a @placeholder renders, which the browser removes', async () => {
    const { result } = await analyze({
      'root.xd.component.ts': component('root'),
      'root.html': `${importing('spinner')}\n@client { } @placeholder { <x-spinner /> }`,
      'spinner.xd.component.ts': component('spinner'),
      'spinner.html': ''
    });

    expect(result.statics).toEqual(['x-spinner']);
  });

  it('keeps together the components sharing a module or a template', async () => {
    const { result } = await analyze({
      'pair.xd.component.ts': `${component('one')}\n@WebComponent({ selector: 'x-two', templateUrl: './two.html' })\nexport class two extends CustomElement { public onInit(): void { } }`,
      'one.html': '',
      'two.html': '',
      'shared.xd.component.ts': `${component('three', '', '', '').replace('./three.html', './four.html')}`,
      'four.xd.component.ts': component('four', 'public onInit(): void { }'),
      'four.html': ''
    });

    expect(result.statics).toEqual([]);
    expect(result.interactive.get('x-one')).toBe('shares its module or its template with <x-two>');
    expect(result.interactive.get('x-three')).toBe('shares its module or its template with <x-four>');
  });

  it('keeps a component rendering one outside of the project, or a template it cannot read', async () => {
    const { result } = await analyze({
      'outer.xd.component.ts': component('outer'),
      'outer.html': '@import { Removed } from \'./removed.xd.component\'\n<x-removed />',
      'removed.xd.component.ts.txt': component('removed'),
      'broken.xd.component.ts': component('broken'),
      'broken.html': '<p>',
      'missing.xd.component.ts': component('missing')
    });

    expect(result.interactive.get('x-outer')).toBe('its template cannot be read');
    expect(result.interactive.get('x-broken')).toBe('its template cannot be read');
    expect(result.interactive.get('x-missing')).toBe('its template cannot be read');
  });

  it('keeps a component rendering a component outside of the project', async () => {
    const { result } = await analyze({
      'root.xd.component.ts': component('root'),
      'root.html': `${importing('stranger')}\n<x-stranger />`,
      'stranger.xd.component.ts': component('stranger'),
      'stranger.html': ''
    }, 'entry-server', ['stranger.xd.component.ts']);

    expect(result.interactive.get('x-root')).toBe('renders <x-stranger>, which is outside of the project');
  });

  it('marks a component rendering a component of the project it could not read', async () => {
    const { result } = await analyze({
      'root.xd.component.ts': component('root'),
      'root.html': `${importing('twice')}\n<x-twice />`,
      'twice.xd.component.ts': component('twice', '@Property(\'\', { alias: \'a\' }) public accessor one!: () => string;\n@Property(\'\', { alias: \'a\' }) public accessor two!: () => string;'),
      'twice.html': ''
    });

    expect(result.interactive.get('x-root')).toBeDefined();
    expect(result.statics).toEqual([]);
  });

  it('reads no component out of a module without them', async () => {
    const { result } = await analyze({
      'plain.xd.component.ts': 'export const a = 1;',
      'unreadable.xd.component.ts': '@WebComponent({ selector, templateUrl }) export class A { }'
    });

    expect(result.statics).toEqual([]);
    expect(result.interactive.size).toBe(0);
  });

  it('reads a file of the project that cannot be read as an empty one', async () => {
    const state = {
      compilerOptions: COMPILER_OPTIONS,
      projectFileNames: ['/gone.xd.component.ts'],
      root: '/',
      ssr: { entry: 'entry' },
      host: { readFile: () => undefined }
    } as unknown as XaendarPluginState;

    expect((await findStaticComponents(state)).statics).toEqual([]);
  });
});

describe('describeStaticComponents', () => {
  const result = { modules: new Map(), islands: new Map(), statics: ['x-a', 'x-b'], interactive: new Map([['x-c', 'declares onInit']]) };

  it('counts and lists the static components', () => {
    expect(describeStaticComponents(result, false)).toBe('Xaendar: 2 of 3 components are static, left out of the bundle of the browser\n  x-a, x-b');
  });

  it('tells what keeps the others in the bundle, when asked to', () => {
    expect(describeStaticComponents(result, true)).toBe('Xaendar: 2 of 3 components are static, left out of the bundle of the browser\n  x-a, x-b\n  x-c: declares onInit');
  });

  it('lists nothing without static components', () => {
    expect(describeStaticComponents({ ...result, statics: [] }, false)).toBe('Xaendar: 0 of 1 components are static, left out of the bundle of the browser');
  });
});
