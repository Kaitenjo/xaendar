import { describe, expect, it } from 'vitest';
import type { CompilerCache } from '../../../types/compiler-cache.type';
import { CompilerContext } from './compiler-context.model';

describe('CompilerContext', () => {
  describe('constructor', () => {
    it('registers plain and typed identifiers', () => {
      const context = new CompilerContext(undefined, ['a', ['b', 'signal']]);
      expect(context.getIdentifierKind('a')).toBe('value');
      expect(context.getIdentifierKind('b')).toBe('signal');
    });

    it('accepts an empty identifier list', () => {
      expect(new CompilerContext(undefined, []).hasIdentifier('a')).toBe(false);
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

    it('throws when adding a duplicated identifier', () => {
      const context = new CompilerContext();
      context.addIdentifier('a');
      expect(() => context.addIdentifier('a')).toThrow('Identifier "a" is already declared in this scope.');
    });

    it('resolves identifiers and kinds through the parent chain', () => {
      const parent = new CompilerContext(undefined, [['a', 'signal']]);
      const child = new CompilerContext(parent);
      expect(child.hasIdentifier('a')).toBe(true);
      expect(child.getIdentifierKind('a')).toBe('signal');
      expect(child.hasIdentifier('missing')).toBe(false);
      expect(child.getIdentifierKind('missing')).toBeUndefined();
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

    it('throws when the name is already a declared identifier', () => {
      const context = new CompilerContext(undefined, ['a']);
      expect(() => context.addUnresolvableIdentifier('a')).toThrow('Identifier "a" is already declared in this scope.');
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
});
