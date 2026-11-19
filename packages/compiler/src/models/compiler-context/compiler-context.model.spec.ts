import { describe, expect, it } from 'vitest';
import { CompilerContext } from './compiler-context.model';

describe('CompilerContext', () => {
  describe('constructor', () => {
    it('starts without identifiers', () => {
      expect(new CompilerContext().hasIdentifier('a')).toBe(false);
    });
  });

  describe('identifiers', () => {
    it('adds and finds identifiers', () => {
      const context = new CompilerContext();
      context.addIdentifier('a');
      expect(context.hasIdentifier('a')).toBe(true);
    });

    it('registers plain and typed identifiers', () => {
      const context = new CompilerContext();
      context.addIdentifier('a');
      context.addIdentifier('b', 'signal');
      expect(context.getIdentifierKind('a')).toBe('value');
      expect(context.getIdentifierKind('b')).toBe('signal');
    });

    it('throws when adding a duplicated identifier', () => {
      const context = new CompilerContext();
      context.addIdentifier('a');
      expect(() => context.addIdentifier('a')).toThrow('Identifier "a" is already declared in this scope.');
    });

    it('resolves identifiers and kinds through the parent chain', () => {
      const parent = new CompilerContext();
      parent.addIdentifier('a', 'signal');
      const child = new CompilerContext(parent);
      expect(child.hasIdentifier('a')).toBe(true);
      expect(child.getIdentifierKind('a')).toBe('signal');
      expect(child.hasIdentifier('missing')).toBe(false);
      expect(child.getIdentifierKind('missing')).toBeUndefined();
    });

    it('allows shadowing a parent identifier, resolving to the nearest scope', () => {
      const parent = new CompilerContext();
      parent.addIdentifier('$index');
      const child = new CompilerContext(parent);
      child.addIdentifier('$index', 'signal');
      const grandChild = new CompilerContext(child);
      expect(child.getIdentifierKind('$index')).toBe('signal');
      expect(grandChild.getIdentifierKind('$index')).toBe('signal');
      expect(parent.getIdentifierKind('$index')).toBe('value');
    });

  });

  describe('slots', () => {
    it('gives each variable the next slot of its scope, after the header, and an identifier unique in the template', () => {
      const root = new CompilerContext();
      root.addIdentifier('a');
      root.addIdentifier('row', 'value', 'template_row_0');
      root.addIdentifier('b', 'variable');
      const child = new CompilerContext(root);
      child.addIdentifier('c');

      expect(root.variableNames).toEqual(['a', 'b']);
      expect(root.identifierCount).toBe(2);
      expect(root.addressOf('b')).toEqual({ depth: 0, slot: 6, id: 1 });
      expect(child.addressOf('c')).toEqual({ depth: 0, slot: 5, id: 2 });
      expect(child.idOf('a')).toBe(0);
      expect(child.idOf('row')).toBeUndefined();
      expect(child.idOf('missing')).toBeUndefined();
    });

    it('reads a variable some scopes up, counting only the scopes standing for a scope of the runtime, the nearest one shadowing the others', () => {
      const root = new CompilerContext();
      root.addIdentifier('row');
      root.addIdentifier('title');
      const block = new CompilerContext(root);
      block.addIdentifier('title');
      // The children of an element opening a namespace, and the ones of an element structural directives are applied to declaring nothing
      const children = new CompilerContext(new CompilerContext(block, 'svg', 'declarations'), undefined, 'declarations');
      const scope = new CompilerContext(children);

      expect(children.opensScope).toBe(false);
      expect(scope.opensScope).toBe(true);
      expect(children.readIdentifier('title')).toBe('_read(context, 0, 5)');
      expect(scope.readIdentifier('title')).toBe('_read(context, 1, 5)');
      expect(scope.readIdentifier('row')).toBe('_read(context, 2, 5)');
      expect(scope.addressOf('missing')).toBeUndefined();
    });

    it('opens a scope for the children declaring variables', () => {
      const children = new CompilerContext(new CompilerContext(), undefined, 'declarations');
      children.addIdentifier('ref');

      expect(children.opensScope).toBe(true);
    });

    it('reads an identifier taking no slot through its own expression, and tells how many scopes up it is declared', () => {
      const root = new CompilerContext();
      root.addIdentifier('row', 'value', 'template_row_0');
      const scope = new CompilerContext(new CompilerContext(root, 'svg', 'declarations'));

      expect(scope.readIdentifier('row')).toBe('template_row_0');
      expect(scope.addressOf('row')).toBeUndefined();
      expect(scope.depthOf('row')).toBe(1);
      expect(root.depthOf('row')).toBe(0);
      expect(scope.depthOf('missing')).toBeUndefined();
    });
  });

  describe('identifierCount', () => {
    it('counts the identifiers of the own scope only, not the other names it knows', () => {
      const parent = new CompilerContext();
      parent.addIdentifier('outer');
      const context = new CompilerContext(parent);
      context.addIdentifier('a');
      context.addIdentifier('b', 'signal');
      context.addUnresolvableIdentifier('track');
      context.addImportedIdentifier('format', '__format');
      context.addSignalClassField('count');

      expect(context.identifierCount).toBe(2);
      expect(new CompilerContext().identifierCount).toBe(0);
    });
  });

  describe('unresolvable identifiers', () => {
    it('adds, finds and removes unresolvable identifiers', () => {
      const context = new CompilerContext();
      context.addUnresolvableIdentifier('$event', 'signal');
      expect(context.hasUnresolvableIdentifier('$event')).toBe(true);
      expect(context.getUnresolvableIdentifierKind('$event')).toBe('signal');
      context.removeUnresolvabledIdentifier('$event');
      expect(context.hasUnresolvableIdentifier('$event')).toBe(false);
    });

    it('defaults the kind to value', () => {
      const context = new CompilerContext();
      context.addUnresolvableIdentifier('$event');
      expect(context.getUnresolvableIdentifierKind('$event')).toBe('value');
    });

    it('throws when adding a duplicated unresolvable identifier', () => {
      const context = new CompilerContext();
      context.addUnresolvableIdentifier('$event');
      expect(() => context.addUnresolvableIdentifier('$event')).toThrow('Identifier "$event" is already declared in this scope.');
    });

    it('keeps unresolvable identifiers separate from plain identifiers', () => {
      const context = new CompilerContext();
      context.addIdentifier('a');
      context.addUnresolvableIdentifier('a', 'signal');
      expect(context.getIdentifierKind('a')).toBe('value');
      expect(context.getUnresolvableIdentifierKind('a')).toBe('signal');
    });

    it('allows shadowing a parent unresolvable identifier, resolving to the nearest scope', () => {
      const parent = new CompilerContext();
      parent.addUnresolvableIdentifier('$event');
      const child = new CompilerContext(parent);
      child.addUnresolvableIdentifier('$event', 'signal');
      expect(child.getUnresolvableIdentifierKind('$event')).toBe('signal');
      expect(parent.getUnresolvableIdentifierKind('$event')).toBe('value');
    });

    it('resolves through the parent chain', () => {
      const parent = new CompilerContext();
      parent.addUnresolvableIdentifier('$event');
      const child = new CompilerContext(parent);
      expect(child.hasUnresolvableIdentifier('$event')).toBe(true);
      expect(child.getUnresolvableIdentifierKind('$event')).toBe('value');
      expect(child.hasUnresolvableIdentifier('missing')).toBe(false);
    });
  });

  describe('imported identifiers', () => {
    it('finds the names imported in the scope or in its ancestors', () => {
      const parent = new CompilerContext();
      parent.addImportedIdentifier('count', '_import0.count', 'signal');
      const child = new CompilerContext(parent);
      child.addImportedIdentifier('format', '_import1.format');

      expect(child.getImportedIdentifier('count')).toEqual({ expression: '_import0.count', kind: 'signal', used: false });
      expect(child.getImportedIdentifier('format')).toEqual({ expression: '_import1.format', kind: 'value', used: false });
      expect(parent.getImportedIdentifier('format')).toBeUndefined();
    });
  });

  describe('shadowing members', () => {
    it('finds the members registered in the scope or in its ancestors', () => {
      const parent = new CompilerContext();
      parent.addShadowingMember('name');
      const child = new CompilerContext(parent);

      expect(child.hasShadowingMember('name')).toBe(true);
      expect(child.hasShadowingMember('missing')).toBe(false);
    });
  });

  describe('signal fields', () => {
    it('adds and finds signal fields through the parent chain', () => {
      const parent = new CompilerContext();
      parent.addSignalClassField('count');
      const child = new CompilerContext(parent);
      expect(parent.hasSignalField('count')).toBe(true);
      expect(child.hasSignalField('count')).toBe(true);
      expect(child.hasSignalField('missing')).toBe(false);
    });

    it('throws when adding a duplicated signal field', () => {
      const context = new CompilerContext();
      context.addSignalClassField('count');
      expect(() => context.addSignalClassField('count')).toThrow('Signal field "count" is already declared in this scope.');
    });
  });

  describe('custom elements of other libraries', () => {
    it('matches the tag names against the patterns of the scope chain', () => {
      const parent = new CompilerContext();
      parent.addCustomElementPatterns('sl-*');
      const child = new CompilerContext(parent);
      child.addCustomElementPatterns('my-widget');

      expect(child.isForeignElement('sl-button')).toBe(true);
      expect(child.isForeignElement('my-widget')).toBe(true);
      expect(parent.isForeignElement('my-widget')).toBe(false);
      expect(child.isForeignElement('x-card')).toBe(false);
    });
  });

  describe('namespace', () => {
    it('defaults to the HTML namespace', () => {
      expect(new CompilerContext().namespace).toBe('html');
      expect(new CompilerContext(new CompilerContext()).namespace).toBe('html');
    });

    it('inherits the namespace of its closest ancestor scope declaring one', () => {
      const svg = new CompilerContext(new CompilerContext(), 'svg');

      expect(new CompilerContext(new CompilerContext(svg)).namespace).toBe('svg');
      expect(new CompilerContext(svg, 'html').namespace).toBe('html');
    });
  });

  describe('declaresIdentifier', () => {
    it('tells whether this scope declares an identifier, resolvable or not, ignoring the ancestor scopes', () => {
      const parent = new CompilerContext();
      parent.addIdentifier('item');
      const child = new CompilerContext(parent);
      child.addIdentifier('row');
      child.addUnresolvableIdentifier('field');

      expect(child.declaresIdentifier('row')).toBe(true);
      expect(child.declaresIdentifier('field')).toBe(true);
      expect(child.declaresIdentifier('item')).toBe(false);
      expect(parent.declaresIdentifier('item')).toBe(true);
    });
  });

  describe('templates', () => {
    it('returns the namespace of the template a name refers to, looking up the ancestor scopes', () => {
      const parent = new CompilerContext();
      parent.addIdentifier('row');
      parent.addTemplate('row', 'svg');
      const child = new CompilerContext(new CompilerContext(parent));

      expect(child.getTemplateNamespace('row')).toBe('svg');
      expect(parent.getTemplateNamespace('row')).toBe('svg');
    });

    it('tells that a name refers to no template when a closer scope declares it as anything else, or nobody declares it', () => {
      const parent = new CompilerContext();
      parent.addIdentifier('row');
      parent.addTemplate('row', 'html');
      const child = new CompilerContext(parent);
      child.addUnresolvableIdentifier('row');
      parent.addIdentifier('field');

      expect(child.getTemplateNamespace('row')).toBeUndefined();
      expect(child.getTemplateNamespace('field')).toBeUndefined();
      expect(child.getTemplateNamespace('missing')).toBeUndefined();
    });
  });
});
