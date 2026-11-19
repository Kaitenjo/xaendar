import { beforeEach, describe, expect, it } from 'vitest';
import { clearComponentToImports, clearImportRegistry, clearImportToComponents, findComponentsForImport, registerImport } from './import-registry';

beforeEach(() => {
  clearImportRegistry();
});

describe('import-registry', () => {
  it('maps an imported component to every component importing it', () => {
    registerImport('/src/card.xd.component.ts', '/src/a.xd.component.ts');
    registerImport('/src/card.xd.component.ts', '/src/b.xd.component.ts');
    registerImport('/src/card.xd.component.ts', '/src/a.xd.component.ts');

    expect(findComponentsForImport('/src/card.xd.component.ts')).toEqual(new Set(['/src/a.xd.component.ts', '/src/b.xd.component.ts']));
    expect(findComponentsForImport('/src/other.xd.component.ts')).toBeUndefined();
  });

  describe('clearComponentToImports()', () => {
    it('clears the imports of a component, dropping the components no longer imported', () => {
      registerImport('/src/card.xd.component.ts', '/src/a.xd.component.ts');
      registerImport('/src/chip.xd.component.ts', '/src/a.xd.component.ts');
      registerImport('/src/card.xd.component.ts', '/src/b.xd.component.ts');

      clearComponentToImports('/src/a.xd.component.ts');

      expect(findComponentsForImport('/src/card.xd.component.ts')).toEqual(new Set(['/src/b.xd.component.ts']));
      expect(findComponentsForImport('/src/chip.xd.component.ts')).toBeUndefined();
    });

    it('ignores components without registered imports', () => {
      registerImport('/src/card.xd.component.ts', '/src/a.xd.component.ts');

      clearComponentToImports('/src/unknown.xd.component.ts');

      expect(findComponentsForImport('/src/card.xd.component.ts')).toEqual(new Set(['/src/a.xd.component.ts']));
    });
  });

  describe('clearImportToComponents()', () => {
    it('forgets a deleted component in every component importing it', () => {
      registerImport('/src/card.xd.component.ts', '/src/a.xd.component.ts');
      registerImport('/src/chip.xd.component.ts', '/src/a.xd.component.ts');
      registerImport('/src/card.xd.component.ts', '/src/b.xd.component.ts');

      clearImportToComponents('/src/card.xd.component.ts');
      expect(findComponentsForImport('/src/card.xd.component.ts')).toBeUndefined();

      // a still imports chip, b imports nothing more: clearing b finds nothing to remove
      clearComponentToImports('/src/b.xd.component.ts');
      clearComponentToImports('/src/a.xd.component.ts');
      expect(findComponentsForImport('/src/chip.xd.component.ts')).toBeUndefined();
    });

    it('ignores paths imported by no component', () => {
      registerImport('/src/card.xd.component.ts', '/src/a.xd.component.ts');

      clearImportToComponents('/src/unknown.xd.component.ts');

      expect(findComponentsForImport('/src/card.xd.component.ts')).toEqual(new Set(['/src/a.xd.component.ts']));
    });
  });

  it('resets every mapping', () => {
    registerImport('/src/card.xd.component.ts', '/src/a.xd.component.ts');

    clearImportRegistry();

    expect(findComponentsForImport('/src/card.xd.component.ts')).toBeUndefined();
  });
});
