import { removeDocumentOverlay, setDocumentOverlay } from '@xaendar/language-core';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { TemplateRegistry } from './template-registry';

let root: string;
const path = (relativePath: string) => join(root, relativePath);
const write = (relativePath: string, text: string) => {
  mkdirSync(dirname(path(relativePath)), { recursive: true });
  writeFileSync(path(relativePath), text);
};
const component = (className: string, templateUrl: string) => `@WebComponent({ selector: '${className.toLowerCase()}-el', templateUrl: '${templateUrl}' })\nexport class ${className} {}\n`;

beforeAll(() => {
  root = mkdtempSync(join(tmpdir(), 'xaendar-template-registry-'));
  write('src/app/app.xd.component.ts', component('App', './app.xd.component.html'));
  write('src/shared/card.xd.component.ts', `${component('Card', '../app/app.xd.component.html')}${component('Panel', './panel.xd.component.html')}`);
  write('node_modules/lib/lib.xd.component.ts', component('Lib', './lib.xd.component.html'));
  write('src/dynamic.xd.component.ts', 'const url = \'x\';\n@WebComponent({ selector: \'dynamic-el\', templateUrl: url })\nexport class Dynamic {}\n');
});

afterAll(() => {
  rmSync(root, { recursive: true, force: true });
});

const classesOf = (registry: TemplateRegistry, templatePath: string) => {
  const components = registry.resolve(templatePath);
  return components && Object.fromEntries([...components].map(([fileName, classNames]) => [fileName.replace(/\\/g, '/').replace(root.replace(/\\/g, '/'), ''), classNames]));
};

describe('TemplateRegistry', () => {
  it('indexes the components of the workspace by the templates they use, leaving out node_modules', async () => {
    const registry = new TemplateRegistry();
    await registry.build([root]);

    expect(classesOf(registry, path('src/app/app.xd.component.html'))).toEqual({
      '/src/app/app.xd.component.ts': ['App'],
      '/src/shared/card.xd.component.ts': ['Card']
    });
    expect(classesOf(registry, path('src/shared/panel.xd.component.html'))).toEqual({ '/src/shared/card.xd.component.ts': ['Panel'] });
    expect(registry.resolve(path('node_modules/lib/lib.xd.component.html'))).toBeUndefined();
  });

  it('indexes a component again with its unsaved text, forgetting the templates it doesn\'t use anymore', async () => {
    const registry = new TemplateRegistry();
    await registry.build([root]);

    setDocumentOverlay(path('src/shared/card.xd.component.ts'), component('Card', './card.xd.component.html'));
    await registry.index(path('src/shared/card.xd.component.ts'));
    removeDocumentOverlay(path('src/shared/card.xd.component.ts'));

    expect(classesOf(registry, path('src/app/app.xd.component.html'))).toEqual({ '/src/app/app.xd.component.ts': ['App'] });
    expect(registry.resolve(path('src/shared/panel.xd.component.html'))).toBeUndefined();
    expect(classesOf(registry, path('src/shared/card.xd.component.html'))).toEqual({ '/src/shared/card.xd.component.ts': ['Card'] });
  });

  it('removes a deleted component, and indexes nothing for a file that cannot be read or whose metadata cannot be extracted', async () => {
    const registry = new TemplateRegistry();
    await registry.build([root]);

    registry.remove(path('src/app/app.xd.component.ts'));
    expect(classesOf(registry, path('src/app/app.xd.component.html'))).toEqual({ '/src/shared/card.xd.component.ts': ['Card'] });

    await registry.index(path('src/missing.xd.component.ts'));
    write('src/broken.xd.component.ts', '@WebComponent({ selector: \'broken-el\', templateUrl: \'./broken.html\' })\nexport class Broken {\n  @Property(0, { alias: \'b\' }) accessor a!: number;\n  @Property() accessor b!: number;\n}\n');
    await registry.index(path('src/broken.xd.component.ts'));

    expect(registry.resolve(path('src/broken.html'))).toBeUndefined();
    expect(registry.resolve(path('src/missing.xd.component.html'))).toBeUndefined();
  });
});
