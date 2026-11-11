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

  describe('getReads', () => {
    it('returns no constant for a binding reading no variable', () => {
      const context = new GeneratorContext(cache);

      expect(context.getReads(undefined)).toBeUndefined();
      expect(context.getReads([])).toBeUndefined();
      expect(context.readsDeclarations).toEqual([]);
    });

    it('shares in the root scope one constant per list of variables, whatever their order', () => {
      const root = new GeneratorContext(cache);
      const scope = new GeneratorContext(root);

      expect(scope.getReads(['row', 'col'])).toBe('_reads0');
      expect(root.getReads(['col', 'row'])).toBe('_reads0');
      expect(root.getReads(['row'])).toBe('_reads1');
      expect(root.readsDeclarations).toEqual(['const _reads0 = [\'col\', \'row\'];', 'const _reads1 = [\'row\'];']);
    });
  });

  describe('declareConstant', () => {
    it('declares a constant of the module under the name it is given, returning that name', () => {
      const context = new GeneratorContext(cache);

      expect(context.declareConstant('td0$element', '{ tagName: \'td\' }')).toBe('td0$element');
      expect(context.constantDeclarations).toEqual(['const td0$element = { tagName: \'td\' };']);
    });

    it('appends to a name already taken the first number not taken', () => {
      const context = new GeneratorContext(cache);
      context.declareConstant('div0$if', '1');
      context.declareConstant('div0$if', '2');

      expect(context.declareConstant('div0$if', '3')).toBe('div0$if2');
      expect(context.constantDeclarations).toEqual(['const div0$if = 1;', 'const div0$if1 = 2;', 'const div0$if2 = 3;']);
    });

    it('holds the constants of every scope in the root one, in the order they are declared', () => {
      const root = new GeneratorContext(cache);
      const scope = new GeneratorContext(new GeneratorContext(root));
      root.declareConstant('a$element', '1');
      expect(scope.declareConstant('a$element', '2')).toBe('a$element1');
      root.declareConstant('b$element', '3');

      expect(root.constantDeclarations).toEqual(['const a$element = 1;', 'const a$element1 = 2;', 'const b$element = 3;']);
      expect(scope.constantDeclarations).toEqual([]);
    });
  });

  describe('declareFunction', () => {
    it('declares a function of the module with its parameters and its body indented, returning its name', () => {
      const context = new GeneratorContext(cache);

      expect(context.declareFunction('td0$on_click', 'context, $event', ['const row = context.get(\'row\');', 'this.select(row, $event);'])).toBe('td0$on_click');
      expect(context.functionDeclarations).toEqual([[
        'function td0$on_click(context, $event) {',
        '  const row = context.get(\'row\');',
        '  this.select(row, $event);',
        '}'
      ].join('\n')]);
    });

    it('declares a function without a body', () => {
      const context = new GeneratorContext(cache);
      context.declareFunction('div0$noop', 'context', []);

      expect(context.functionDeclarations).toEqual(['function div0$noop(context) {\n}']);
    });

    it('shares the names of the module with the constants, appending a number to a name already taken', () => {
      const context = new GeneratorContext(cache);
      context.declareConstant('div0$if', '{}');

      expect(context.declareFunction('div0$if', 'context', ['return 1;'])).toBe('div0$if1');
      expect(context.declareFunction('div0$if', 'context', ['return 2;'])).toBe('div0$if2');
    });

    it('holds the functions of every scope in the root one, in the order they are declared', () => {
      const root = new GeneratorContext(cache);
      const scope = new GeneratorContext(root);
      scope.declareFunction('a$text0', 'context', ['return 1;']);
      root.declareFunction('b$text0', 'context', ['return 2;']);
      expect(scope.declareFunction('a$text0', 'context', ['return 3;'])).toBe('a$text01');

      expect(root.functionDeclarations).toEqual([
        'function a$text0(context) {\n  return 1;\n}',
        'function b$text0(context) {\n  return 2;\n}',
        'function a$text01(context) {\n  return 3;\n}'
      ]);
      expect(scope.functionDeclarations).toEqual([]);
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
