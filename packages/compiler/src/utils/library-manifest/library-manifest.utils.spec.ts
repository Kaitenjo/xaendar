import { describe, expect, it } from 'vitest';
import { ComponentPropertyMetadata } from '../../type-checker/models/component-property-metadata/component-property-metadata.model';
import type { ComponentOrDirectiveMetadata } from '../../types/component-or-directive-metadata.type';
import { listTypeReferences, mapTypeModules, toLibraryDeclaration } from './library-manifest.utils';

/**
 * Writes a module of the library relative to the root of its package, as the build of a library does.
 */
const toPackage = (module: string) => (module.startsWith('/lib/src/') ? `./${module.slice('/lib/src/'.length)}` : module);

describe('mapTypeModules()', () => {
  it('rewrites the modules of the import() types, keeping the names they reference', () => {
    expect(mapTypeModules('ReturnType<import(\'/lib/src/card\').Card[\'label\']> | import(\'/lib/src/size\').Size', toPackage)).toBe('ReturnType<import(\'./card\').Card[\'label\']> | import(\'./size\').Size');
    expect(mapTypeModules('import(\'@xaendar/core\').Output<string>', toPackage)).toBe('import(\'@xaendar/core\').Output<string>');
    expect(mapTypeModules('import(\'/lib/src/types\')[\'Tag\']', toPackage)).toBe('import(\'./types\')[\'Tag\']');
    expect(mapTypeModules('string', toPackage)).toBe('string');
  });
});

describe('listTypeReferences()', () => {
  it('lists the names the import() types reference in their modules', () => {
    expect(listTypeReferences('ReturnType<import(\'/lib/src/card\').Card<Item>[\'items\']> | import(\'@xaendar/core\').Output<import(\'/lib/src/size\').Size>')).toEqual([
      { module: '/lib/src/card', name: 'Card' },
      { module: '@xaendar/core', name: 'Output' },
      { module: '/lib/src/size', name: 'Size' }
    ]);
  });

  it('lists nothing for a type referencing no name of a module', () => {
    expect(listTypeReferences('string | number')).toBeUndefined();
    expect(listTypeReferences('import(\'/lib/src/types\')[\'Tag\']')).toBeUndefined();
  });
});

describe('toLibraryDeclaration()', () => {
  it('describes a component, its inputs by the names a template binds, its events, its type parameters and its rendering', () => {
    const metadata = {
      type: 'component',
      className: 'Card',
      selector: 'ui-card',
      modulePath: '/lib/src/card.ts',
      templateUrl: './card.html',
      properties: new Map([
        ['text', new ComponentPropertyMetadata('label', 'ReturnType<import(\'/lib/src/card\').Card<Item>[\'label\']>', { alias: 'text' })],
        ['count', new ComponentPropertyMetadata('count', 'number', { required: true })],
        ['tip', new ComponentPropertyMetadata('tip', 'string', { alias: 'tip', exposed: true })]
      ]),
      events: new Map([['pressed', { type: 'import(\'/lib/src/card\').Card<Item>[\'pressed\']' }], ['closed', { type: 'void' }]]),
      typeParameters: [{ name: 'Item', hasDefault: true }],
      clientOnly: { hydrate: 'idle' },
      typescriptNodes: {}
    } as unknown as ComponentOrDirectiveMetadata;

    expect(toLibraryDeclaration(metadata, './card', './card.d.ts', toPackage)).toEqual({
      type: 'component',
      className: 'Card',
      selector: 'ui-card',
      module: './card',
      types: './card.d.ts',
      inputs: [
        { name: 'text', property: 'label', type: 'ReturnType<import(\'./card\').Card<Item>[\'label\']>' },
        { name: 'count', required: true, type: 'number' },
        { name: 'tip', exposed: true, type: 'string' }
      ],
      events: [{ name: 'pressed', type: 'import(\'./card\').Card<Item>[\'pressed\']' }, { name: 'closed', type: 'void' }],
      typeParameters: [{ name: 'Item', hasDefault: true }],
      ssr: { render: false, hydrate: 'idle' }
    });
  });

  it('describes a directive, and a component rendering only in the browser without a trigger', () => {
    const directive = { type: 'directive', className: 'Tip', selector: 'uiTip', modulePath: '/lib/src/tip.ts', properties: new Map(), events: new Map() } as unknown as ComponentOrDirectiveMetadata;
    const component = { type: 'component', className: 'Map', selector: 'ui-map', modulePath: '/lib/src/map.ts', properties: new Map(), events: new Map(), typeParameters: [], clientOnly: {} } as unknown as ComponentOrDirectiveMetadata;

    expect(toLibraryDeclaration(directive, './tip', './tip.d.ts', toPackage)).toEqual({ type: 'directive', className: 'Tip', selector: 'uiTip', module: './tip', types: './tip.d.ts', inputs: [], events: [] });
    expect(toLibraryDeclaration(component, './map', './map.d.ts', toPackage).ssr).toEqual({ render: false });
    expect(toLibraryDeclaration(component, './map', './map.d.ts', toPackage)).not.toHaveProperty('typeParameters');
  });
});
