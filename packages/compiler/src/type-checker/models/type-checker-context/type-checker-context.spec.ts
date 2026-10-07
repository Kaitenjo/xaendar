import { describe, expect, it } from 'vitest';
import { ComponentMetadata } from '../../../types/component-metadata/component-metadata.type';
import { ComponentOrDirectiveMetadata } from '../../../types/component-or-directive-metadata.type';
import { TypeCheckContext } from './type-checker-context';

const component = { type: 'component', selector: 'my-a' } as unknown as ComponentMetadata;
const directive = { type: 'directive', selector: 'my-a' } as unknown as ComponentOrDirectiveMetadata;

describe('TypeCheckContext', () => {
  it('finds an imported component by its selector', () => {
    const context = new TypeCheckContext();
    context.addImport(directive, component);

    expect(context.getImportBySelector('my-a')).toBe(component);
  });

  it('ignores directives and unknown selectors', () => {
    const context = new TypeCheckContext();
    context.addImport(directive, component);

    expect(context.getImportBySelector('my-c')).toBeUndefined();
    expect(new TypeCheckContext().getImportBySelector('my-a')).toBeUndefined();
  });

  it('finds an imported directive by its selector, ignoring components', () => {
    const context = new TypeCheckContext();
    context.addImport(component, directive);

    expect(context.getDirectiveBySelector('my-a')).toBe(directive);
    expect(context.getDirectiveBySelector('my-c')).toBeUndefined();
    expect(new TypeCheckContext().getDirectiveBySelector('my-a')).toBeUndefined();
  });

  it('inherits the directives of its ancestor scopes', () => {
    const root = new TypeCheckContext();
    root.addImport(directive);

    expect(new TypeCheckContext(new TypeCheckContext(root)).getDirectiveBySelector('my-a')).toBe(directive);
  });

  it('inherits the imports of its ancestor scopes', () => {
    const root = new TypeCheckContext();
    root.addImport(component);
    const child = new TypeCheckContext(new TypeCheckContext(root));
    child.addIdentifier('item');

    expect(child.getImportBySelector('my-a')).toBe(component);
    expect(child.hasIdentifier('item')).toBe(true);
    expect(child.getImportBySelector('my-z')).toBeUndefined();
  });

  it('defaults the event map to HTMLElementEventMap', () => {
    expect(new TypeCheckContext().eventMap).toBe('HTMLElementEventMap');
    expect(new TypeCheckContext(new TypeCheckContext()).eventMap).toBe('HTMLElementEventMap');
  });

  it('inherits the event map of its closest ancestor scope declaring one', () => {
    const svg = new TypeCheckContext(new TypeCheckContext(), 'SVGElementEventMap');

    expect(new TypeCheckContext(new TypeCheckContext(svg)).eventMap).toBe('SVGElementEventMap');
    expect(new TypeCheckContext(svg, 'MathMLElementEventMap').eventMap).toBe('MathMLElementEventMap');
  });
});
