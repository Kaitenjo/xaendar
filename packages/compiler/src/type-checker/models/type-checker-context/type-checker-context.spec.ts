import { describe, expect, it } from 'vitest';
import { ComponentMetadata } from '../../../types/component-metadata.type';
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

  it('records the instantiations of the generic components in the outermost scope, for the whole template', () => {
    const root = new TypeCheckContext();
    const nested = new TypeCheckContext(new TypeCheckContext(root));
    nested.addInstantiation(12);

    expect(root.hasInstantiation(12)).toBe(true);
    expect(new TypeCheckContext(root).hasInstantiation(12)).toBe(true);
    expect(nested.hasInstantiation(40)).toBe(false);
  });

  it('records in the outermost scope that the template declares templates, registering their namespace', () => {
    const root = new TypeCheckContext();
    const nested = new TypeCheckContext(new TypeCheckContext(root));
    expect(root.usesTemplateHelpers).toBe(false);

    nested.addUnresolvableIdentifier('row');
    nested.addTemplate('row', 'svg');

    expect(root.usesTemplateHelpers).toBe(true);
    expect(nested.usesTemplateHelpers).toBe(true);
    expect(nested.getTemplateNamespace('row')).toBe('svg');
  });

  it('returns the constant holding the value of a signal narrowed in this scope or in an ancestor one', () => {
    const parent = new TypeCheckContext();
    parent.addNarrowedSignal('user', '__if0_user');
    const child = new TypeCheckContext(new TypeCheckContext(parent));

    expect(child.getNarrowedSignal('user')).toBe('__if0_user');
    expect(parent.getNarrowedSignal('user')).toBe('__if0_user');
    expect(child.getNarrowedSignal('count')).toBeUndefined();
  });

  it('tells that a signal is not narrowed where a closer scope declares a variable named like it', () => {
    const parent = new TypeCheckContext();
    parent.addNarrowedSignal('user', '__if0_user');
    const loop = new TypeCheckContext(parent);
    loop.addUnresolvableIdentifier('user', 'signal');

    expect(new TypeCheckContext(loop).getNarrowedSignal('user')).toBeUndefined();
  });

  it('defaults the event map to HTMLElementEventMap', () => {
    expect(new TypeCheckContext().eventMap).toBe('HTMLElementEventMap');
    expect(new TypeCheckContext(new TypeCheckContext()).eventMap).toBe('HTMLElementEventMap');
  });

  it('types the events through the event map of the namespace of its closest ancestor scope declaring one', () => {
    const svg = new TypeCheckContext(new TypeCheckContext(), 'svg');

    expect(new TypeCheckContext(new TypeCheckContext(svg)).eventMap).toBe('SVGElementEventMap');
    expect(new TypeCheckContext(svg, 'mathml').eventMap).toBe('MathMLElementEventMap');
    expect(new TypeCheckContext(svg, 'html').eventMap).toBe('HTMLElementEventMap');
  });
});
