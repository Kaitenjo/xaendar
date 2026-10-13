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
});
