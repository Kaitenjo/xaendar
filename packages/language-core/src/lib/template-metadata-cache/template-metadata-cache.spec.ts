import type { ComponentOrDirectiveMetadata } from '@xaendar/compiler';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { removeDocumentOverlay, setDocumentOverlay } from '../language-service/language-service';
import { createFixtureProject, type FixtureProject } from '../testing/fixture-project/fixture-project.utils';
import { TemplateMetadataCache } from './template-metadata-cache';

let project: FixtureProject;

beforeAll(() => {
  project = createFixtureProject();
});

afterAll(() => {
  project.dispose();
});

describe('TemplateMetadataCache', () => {
  it('extracts the metadata of the components and directives of an imported file, once while its text is unchanged', async () => {
    const cache = new TemplateMetadataCache();
    const child = await cache.getOrInsert('Child', [project.path('src'), './child']);

    expect(child).toMatchObject({ type: 'component', selector: 'my-child' });
    expect(await cache.getOrInsert('Child', [project.path('src'), './child'])).toBe(child);
    expect(await cache.getOrInsert('Media', [project.path('src'), './directives'])).toMatchObject({ type: 'directive', selector: 'media' });
    // A path to the file itself
    expect(await cache.getOrInsert('Child', project.path('src/child.ts'))).toBe(child);
  });

  it('extracts the metadata again when the file is invalidated, or its unsaved text changes', async () => {
    const cache = new TemplateMetadataCache();
    const first = await cache.getOrInsert('Tooltip', [project.path('src'), './directives']);

    cache.invalidate(project.path('src/directives.ts'));
    const second = await cache.getOrInsert('Tooltip', [project.path('src'), './directives']);
    expect(second).not.toBe(first);

    setDocumentOverlay(project.path('src/directives.ts'), '@Directive({ selector: \'renamed\' })\nexport class Tooltip {}\n');
    expect(await cache.getOrInsert('Tooltip', [project.path('src'), './directives'])).toMatchObject({ selector: 'renamed' });
    removeDocumentOverlay(project.path('src/directives.ts'));
  });

  it('returns the metadata of every component and directive of a module, none if it cannot be resolved or read', async () => {
    const cache = new TemplateMetadataCache();
    const metadatas = await cache.getModuleMetadatas(project.path('src'), './directives');

    expect([...metadatas!.keys()]).toEqual(['Tooltip', 'Media']);
    expect(metadatas!.get('Tooltip')).toBe(await cache.getOrInsert('Tooltip', [project.path('src'), './directives']));
    expect(await cache.getModuleMetadatas(project.path('src'), './missing')).toBeUndefined();
    expect(await cache.getModuleMetadatas(project.path('src'), 'a-package')).toBeUndefined();
  });

  it('returns the metadata stored by selector, until cleared', async () => {
    const cache = new TemplateMetadataCache();
    const metadata = { selector: 'stored' } as ComponentOrDirectiveMetadata;
    cache.set('stored', metadata);

    expect(await cache.getOrInsert('stored')).toBe(metadata);

    cache.clear();
    await expect(cache.getOrInsert('stored')).rejects.toThrow('Class "stored" was not found in the import from undefined');
  });

  it('throws for a class the module doesn\'t declare, or a module that cannot be resolved or read', async () => {
    const cache = new TemplateMetadataCache();
    project.write('src/empty.ts', 'export {};\nexport class Plain {}\n');

    await expect(cache.getOrInsert('Plain', [project.path('src'), './empty'])).rejects.toThrow('Class "Plain" was not found in the import from ./empty');
    await expect(cache.getOrInsert('Child', [project.path('src'), './missing'])).rejects.toThrow('Class "Child" was not found in the import from ./missing');
    await expect(cache.getOrInsert('Child', project.path('src/missing.ts'))).rejects.toThrow(`Class "Child" was not found in the import from ${project.path('src/missing.ts')}`);
  });

  it('finds no metadata in a file whose decorators don\'t declare literal selectors', async () => {
    const cache = new TemplateMetadataCache();
    project.write('src/dynamic.ts', 'const name = \'x\';\n@WebComponent({ selector: name, templateUrl: name })\nexport class Dynamic {}\n@Directive({ selector: name })\nexport class DynamicDirective {}\n');

    await expect(cache.getOrInsert('Dynamic', [project.path('src'), './dynamic'])).rejects.toThrow('Class "Dynamic" was not found in the import from ./dynamic');
  });

  it('returns the declarations of the given files, skipping the ones that cannot declare any', async () => {
    const cache = new TemplateMetadataCache();
    project.write('src/clash.ts', [
      'import { InputSignal, Property, WebComponent } from \'@xaendar/core\';',
      '@WebComponent({ selector: \'clash-el\', templateUrl: \'./clash.html\' })',
      'export class Clash {',
      '  @Property(\'\') accessor first!: InputSignal<string>;',
      '  @Property(\'\', { alias: \'first\' }) accessor second!: InputSignal<string>;',
      '}',
      ''
    ].join('\n'));
    const files = ['child.ts', 'directives.ts', 'child-base.ts', 'dynamic.ts', 'clash.ts', 'missing.ts', 'types.d.ts', 'child.spec.ts'].map(name => project.path(`src/${name}`));

    const declarations = await cache.getDeclarations(files);

    expect([...declarations!.keys()]).toEqual([project.path('src/child.ts'), project.path('src/directives.ts')]);
    expect([...declarations!.get(project.path('src/directives.ts'))!.keys()]).toEqual(['Tooltip', 'Media']);
    expect(await cache.getDeclarations([project.path('src/child-base.ts'), project.path('src/missing.ts')])).toBeUndefined();
  });

  it('reads again a file that was found to declare nothing once it is invalidated or the cache cleared', async () => {
    const cache = new TemplateMetadataCache();
    const fileName = project.path('src/late.ts');
    project.write('src/late.ts', 'export class Late {}\n');
    expect(await cache.getDeclarations([fileName])).toBeUndefined();

    project.write('src/late.ts', '@Directive({ selector: \'late\' })\nexport class Late {}\n');
    expect(await cache.getDeclarations([fileName])).toBeUndefined();

    cache.invalidate(fileName);
    expect([...(await cache.getDeclarations([fileName]))!.get(fileName)!.keys()]).toEqual(['Late']);

    project.write('src/late.ts', 'export class Late {}\n');
    cache.clear();
    expect(await cache.getDeclarations([fileName])).toBeUndefined();
  });
});
