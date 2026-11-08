import { describe, expect, it } from 'vitest';
import { CompilerContext } from '../../models/compiler-context/compiler-context.model';
import type { ComponentMetadata } from '../../types/component-metadata.type';
import type { ContextCache } from '../../types/context-cache.type';
import type { DirectiveMetadata } from '../../types/directive-metadata.type';
import { GeneratorContext } from './context';

const cache = {} as ContextCache;

describe('GeneratorContext', () => {
  describe('constructor', () => {
    it('creates a compiler context holding the cache it is given', () => {
      const context = new GeneratorContext(cache, 'svg');

      expect(context).toBeInstanceOf(CompilerContext);
      expect(context.cache).toBe(cache);
      expect(context.namespace).toBe('svg');
    });

    it('inherits the cache from the parent', () => {
      const parent = new GeneratorContext(cache);
      parent.cache = { getOrInsert: async () => undefined, set: () => undefined } as unknown as ContextCache;
      expect(new GeneratorContext(parent).cache).toBe(parent.cache);
    });

    it('inherits the modules the @hydrate blocks load from the parent', () => {
      const parent = new GeneratorContext(cache);
      parent.deferredModules = new Map();
      expect(new GeneratorContext(parent).deferredModules).toBe(parent.deferredModules);
    });

    it('chains to the parent for the identifiers', () => {
      const parent = new GeneratorContext(cache);
      parent.addIdentifier('item');
      expect(new GeneratorContext(parent).hasIdentifier('item')).toBe(true);
    });
  });

  describe('islands', () => {
    it('finds the tag names registered in the scope or in its ancestors', () => {
      const parent = new GeneratorContext(cache);
      const child = new GeneratorContext(parent);
      parent.addIsland('x-a');
      child.addIsland('x-b');

      expect(child.isIsland('x-a')).toBe(true);
      expect(child.isIsland('x-b')).toBe(true);
      expect(parent.isIsland('x-b')).toBe(false);
      expect(child.isIsland('x-c')).toBe(false);
    });
  });

  describe('addEventName', () => {
    it('holds the events of every scope in the root one', () => {
      const root = new GeneratorContext(cache);
      const scope = new GeneratorContext(new GeneratorContext(root));
      root.addEventName('click');
      scope.addEventName('click');
      scope.addEventName('focus');

      expect(Array.from(root.eventNames)).toEqual(['click', 'focus']);
    });
  });

  describe('getClientComponent', () => {
    it('finds the components rendering only in the browser of the scope and of its ancestors', () => {
      const parent = new GeneratorContext(cache);
      const child = new GeneratorContext(parent);
      const inParent = { selector: 'x-a' } as ComponentMetadata;
      const inChild = { selector: 'x-b' } as ComponentMetadata;
      parent.addClientComponent(inParent);
      child.addClientComponent(inChild);

      expect(child.getClientComponent('x-a')).toBe(inParent);
      expect(child.getClientComponent('x-b')).toBe(inChild);
      expect(parent.getClientComponent('x-b')).toBeUndefined();
    });
  });

  describe('getImportedMetadata', () => {
    it('finds the components by tag name and the directives by @@selector, in the scope and in its ancestors', () => {
      const parent = new GeneratorContext(cache);
      const child = new GeneratorContext(parent);
      const component = { type: 'component', selector: 'x-a' } as ComponentMetadata;
      const directive = { type: 'directive', selector: 'tip' } as DirectiveMetadata;
      parent.addImportedMetadata(component);
      child.addImportedMetadata(directive);

      expect(child.getImportedMetadata('x-a')).toBe(component);
      expect(child.getImportedMetadata('@@tip')).toBe(directive);
      expect(child.getImportedMetadata('tip')).toBeUndefined();
      expect(parent.getImportedMetadata('@@tip')).toBeUndefined();
    });
  });
});
