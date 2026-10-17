import { describe, expect, it } from 'vitest';
import type { CompilerCache } from '../../../types/compiler-cache.type';
import { CompilerContext } from './compiler-context.model';

describe('CompilerContext', () => {
  describe('constructor', () => {
    it('starts without identifiers', () => {
      expect(new CompilerContext().hasIdentifier('a')).toBe(false);
    });

    it('inherits the cache from the parent', () => {
      const parent = new CompilerContext();
      parent.cache = { getOrInsert: async () => undefined, set: () => undefined } as unknown as CompilerCache;
      expect(new CompilerContext(parent).cache).toBe(parent.cache);
    });
  });

  describe('identifiers', () => {
    it('adds, finds and removes identifiers', () => {
      const context = new CompilerContext();
      context.addIdentifier('a');
      expect(context.hasIdentifier('a')).toBe(true);
      context.removeIdentifier('a');
      expect(context.hasIdentifier('a')).toBe(false);
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

    it('falls back to the parent identifier once the shadowing one is removed', () => {
      const parent = new CompilerContext();
      parent.addIdentifier('$index');
      const child = new CompilerContext(parent);
      child.addIdentifier('$index', 'signal');
      child.removeIdentifier('$index');
      expect(child.hasIdentifier('$index')).toBe(true);
      expect(child.getIdentifierKind('$index')).toBe('value');
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
