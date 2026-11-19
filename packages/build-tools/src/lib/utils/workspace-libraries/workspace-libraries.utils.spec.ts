import type { ComponentOrDirectiveMetadata, ImportedSymbol } from '@xaendar/compiler';
import { describe, expect, it } from 'vitest';
import { resolvePosixPath } from '../path/path.utils';
import { findWorkspaceLibrary, getLibraryAliases, markClientOnly, resolveWorkspaceLibraries, withLibraryDependencies } from './workspace-libraries.utils';

/**
 * The folder of a library of the workspace, resolved.
 */
const UI_ROOT = resolvePosixPath('/ws/libraries/ui');

/**
 * Two libraries of the workspace, resolved: the first rendering only in the browser, the second on the server too.
 */
const LIBRARIES = [
  { name: '@acme/ui', root: UI_ROOT, entry: `${UI_ROOT}/src/public-api.ts`, ssr: false, customElements: [] },
  { name: 'charts', root: resolvePosixPath('/ws/libraries/charts'), entry: resolvePosixPath('/ws/libraries/charts/lib/index.ts'), ssr: true, customElements: ['sl-*'] }
];

describe('resolveWorkspaceLibraries()', () => {
  it('resolves the folders against the working directory and the entries against the folders, with the defaults', () => {
    expect(resolveWorkspaceLibraries([
      { name: '@acme/ui', root: 'libraries/ui' },
      { name: 'charts', root: resolvePosixPath('/ws/libraries/charts'), entry: 'lib/index.ts', ssr: true, customElements: ['sl-*'] }
    ], '/ws')).toEqual(LIBRARIES);
  });

  it('keeps strictEvents only when the library declares it, the option of the project applying otherwise', () => {
    const [declared, inherited] = resolveWorkspaceLibraries([
      { name: '@acme/ui', root: 'libraries/ui', strictEvents: false },
      { name: 'charts', root: 'libraries/charts' }
    ], '/ws')!;

    expect(declared.strictEvents).toBe(false);
    expect(inherited).not.toHaveProperty('strictEvents');
  });

  it('resolves nothing without libraries', () => {
    expect(resolveWorkspaceLibraries(undefined, '/ws')).toBeUndefined();
    expect(resolveWorkspaceLibraries([], '/ws')).toBeUndefined();
  });
});

describe('findWorkspaceLibrary()', () => {
  it('finds the library whose folder holds a file', () => {
    expect(findWorkspaceLibrary(LIBRARIES, `${UI_ROOT}/src/card/card.xd.component.ts`)).toBe(LIBRARIES[0]);
    expect(findWorkspaceLibrary(LIBRARIES, `${UI_ROOT}/src/card/card.xd.component.ts`.replaceAll('/', '\\'))).toBe(LIBRARIES[0]);
    expect(findWorkspaceLibrary(LIBRARIES, `${UI_ROOT}-other/card.ts`)).toBeUndefined();
    expect(findWorkspaceLibrary(undefined, `${UI_ROOT}/src/card.ts`)).toBeUndefined();
  });
});

describe('getLibraryAliases()', () => {
  it('leads the name of each library to its entry, and the name followed by a path to the folder of its entry', () => {
    const aliases = getLibraryAliases(LIBRARIES);

    expect(aliases.map(({ find, replacement }) => [String(find), replacement])).toEqual([
      ['/^@acme\\/ui$/', `${UI_ROOT}/src/public-api.ts`],
      ['/^@acme\\/ui\\/(.*)$/', `${UI_ROOT}/src/$1`],
      ['/^charts$/', resolvePosixPath('/ws/libraries/charts/lib/index.ts')],
      ['/^charts\\/(.*)$/', `${resolvePosixPath('/ws/libraries/charts/lib')}/$1`]
    ]);
    expect((aliases[0].find as RegExp).test('@acme/ui-kit')).toBe(false);
  });

  it('escapes the characters of a name a regular expression reads', () => {
    const [alias] = getLibraryAliases([{ ...LIBRARIES[0], name: 'ui.kit' }]);

    expect((alias.find as RegExp).test('ui.kit')).toBe(true);
    expect((alias.find as RegExp).test('uiXkit')).toBe(false);
  });
});

describe('markClientOnly()', () => {
  it('marks the components of a library not rendering on the server as rendering only in the browser', () => {
    const component = { type: 'component', modulePath: `${UI_ROOT}/src/card.xd.component.ts` } as ComponentOrDirectiveMetadata;

    expect(markClientOnly(component, LIBRARIES)).toEqual({ type: 'component', modulePath: component.modulePath, clientOnly: {} });
  });

  it('leaves the rest as it is', () => {
    const chart = { type: 'component', modulePath: resolvePosixPath('/ws/libraries/charts/lib/chart.xd.component.ts') } as ComponentOrDirectiveMetadata;
    const withTrigger = { type: 'component', modulePath: `${UI_ROOT}/src/map.xd.component.ts`, clientOnly: { hydrate: 'idle' } } as ComponentOrDirectiveMetadata;
    const directive = { type: 'directive', modulePath: `${UI_ROOT}/src/tip.directive.ts` } as ComponentOrDirectiveMetadata;
    const symbol: ImportedSymbol = { type: 'symbol', modulePath: `${UI_ROOT}/src/format.ts`, reactive: false };
    const project = { type: 'component', modulePath: resolvePosixPath('/ws/src/app.xd.component.ts') } as ComponentOrDirectiveMetadata;

    expect(markClientOnly(chart, LIBRARIES)).not.toHaveProperty('clientOnly');
    expect(markClientOnly(withTrigger, LIBRARIES).clientOnly).toEqual({ hydrate: 'idle' });
    expect(markClientOnly(directive, LIBRARIES)).not.toHaveProperty('clientOnly');
    expect(markClientOnly(symbol, LIBRARIES)).toEqual({ type: 'symbol', modulePath: symbol.modulePath, reactive: false });
    expect(markClientOnly(project, LIBRARIES)).not.toHaveProperty('clientOnly');
    expect(markClientOnly(project, undefined)).not.toHaveProperty('clientOnly');
  });
});

describe('withLibraryDependencies()', () => {
  it('leads the names of the libraries a library depends on to the folders of their builds, keeping the other paths', () => {
    const options = { strict: true, paths: { '@acme/ui': ['./libraries/ui/src/public-api.ts'], '@/*': ['./src/*'] } };

    expect(withLibraryDependencies(options, { '@acme/ui': '/ws/dist/ui' })).toEqual({
      strict: true,
      paths: { '@acme/ui': ['/ws/dist/ui'], '@acme/ui/*': ['/ws/dist/ui/*'], '@/*': ['./src/*'] }
    });
    expect(withLibraryDependencies({}, { charts: '/ws/dist/charts' }).paths).toEqual({ charts: ['/ws/dist/charts'], 'charts/*': ['/ws/dist/charts/*'] });
    expect(withLibraryDependencies(options, undefined)).toBe(options);
  });
});
