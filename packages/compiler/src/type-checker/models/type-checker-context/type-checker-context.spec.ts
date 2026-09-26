import { describe, expect, it } from 'vitest';
import { ComponentMetadata } from '../../../types/component-metadata/component-metadata.type';
import { ComponentOrDirectiveMetadata } from '../../../types/component-or-directive-metadata.type';
import { TypeCheckContext } from './type-checker-context';

const component = { type: 'component', selectors: ['my-a', 'my-b'] } as unknown as ComponentMetadata;
const directive = { type: 'directive', selectors: ['my-a'] } as unknown as ComponentOrDirectiveMetadata;

describe('TypeCheckContext', () => {
  it('finds an imported component by any of its selectors', () => {
    const context = new TypeCheckContext();
    context.addImport(directive, component);

    expect(context.getImportBySelector('my-b')).toBe(component);
  });

  it('ignores directives and unknown selectors', () => {
    const context = new TypeCheckContext();
    context.addImport(directive, component);

    expect(context.getImportBySelector('my-c')).toBeUndefined();
    expect(new TypeCheckContext().getImportBySelector('my-a')).toBeUndefined();
  });

  it('inherits the imports of its ancestor scopes', () => {
    const root = new TypeCheckContext();
    root.addImport(component);
    const child = new TypeCheckContext(new TypeCheckContext(root), ['item']);

    expect(child.getImportBySelector('my-a')).toBe(component);
    expect(child.hasIdentifier('item')).toBe(true);
    expect(child.getImportBySelector('my-z')).toBeUndefined();
  });
});
