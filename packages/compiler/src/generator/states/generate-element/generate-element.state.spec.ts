import { describe, expect, it } from 'vitest';
import { Lexer } from '../../../lexer/lexer/lexer';
import { Parser } from '../../../parser/parser/parser';
import { ElementNode } from '../../../parser/types/nodes/element-node.type';
import type { CompilerCache } from '../../../types/compiler-cache.type';
import { ComponentPropertyMetadata } from '../../../type-checker/models/component-property-metadata/component-property-metadata.model';
import { CompilerContext } from '../../models/compiler-context/compiler-context.model';
import { generateElement } from './generate-element.state';

const parse = (template: string) => new Parser(template, new Lexer(template).tokenize()).parse()[0] as ElementNode;

const cacheWith = (properties: Record<string, ComponentPropertyMetadata>): CompilerCache => ({
  getOrInsert: async () => ({ properties: new Map(Object.entries(properties)) }) as never,
  set: () => undefined
});

const run = async (template: string, context = new CompilerContext(), anchor: string | null = null) => generateElement(parse(template), 'root', '0', context, anchor);

describe('generateElement', () => {
  it('generates a bare element', async () => {
    const { code, functionsToProcess } = await run('<div></div>');
    expect(code).toEqual(['const div0 = _renderElement(root, context, null, \'div\', [], [], []);']);
    expect(functionsToProcess?.size).toBe(0);
  });

  it('forwards the anchor', async () => {
    const { code } = await run('<div></div>', new CompilerContext(), 'anchor');
    expect(code[0]).toContain('context, anchor, \'div\'');
  });

  it('generates literal, expression and reactive attributes', async () => {
    const context = new CompilerContext();
    context.addSignalClassField('count');
    const { code } = await run('<div class="a" title="{name}" id="{count}"></div>', context);
    const output = code.join('\n');

    expect(output).toContain('value: \'a\',');
    expect(output).toContain('setter: _setProperty');
    expect(output).toContain('value: () => this.name, ');
    expect(output).toContain('setter: _setExpressionProperty');
    expect(output).toContain('setter: _setReactiveProperty');
  });

  it('generates events with and without parameters', async () => {
    const { code } = await run('<div @click="f($event, a, $event)" @focus="g()"></div>');
    const output = code.join('\n');

    expect(output).toContain('($event) => $event,');
    expect(output).toContain('() => this.a,');
    expect(output).toContain('() => $event,');
    expect(output).toContain('handler: \'g\',');
    expect(output).toContain('parameters: []');
  });

  it('does not leak $event into the context after generating events', async () => {
    const context = new CompilerContext();
    await run('<div @click="f($event)"></div>', context);

    expect(context.hasUnresolvableIdentifier('$event')).toBe(false);
    expect(() => context.addUnresolvableIdentifier('$event')).not.toThrow();
  });

  it('registers a children function when the element has children', async () => {
    const { code, functionsToProcess } = await run('<div><span></span></div>');
    expect(code).toContain('this.div0Children(div0, context);');
    expect(functionsToProcess?.get('div0Children')).toMatchObject({
      fn: { parentNode: 'div0', precode: '' },
      args: ['div0', 'parentContext', 'anchor']
    });
  });

  it.each([
    ['svg', 'context.createElement = _createSVGElement;'],
    ['math', 'context.createElement = _createMATHMLElement;']
  ])('overrides the element factory for %s', async (tag, precode) => {
    const { code, functionsToProcess } = await run(`<${tag}><b></b></${tag}>`);
    expect(code[0]).toBe(precode);
    expect(code).toContain('context.createElement = _createElement;');
    expect(functionsToProcess?.get(`${tag}0Children`)?.fn.precode).toBe(precode);
  });

  describe('dynamic bindings', () => {
    it('skips bindings without content', async () => {
      const { code } = await run('<div @(cond(),)></div>');
      expect(code).toEqual(['const div0 = _renderElement(root, context, null, \'div\', [], [], []);']);
    });

    it('generates attributes, events and nested bindings', async () => {
      const { code } = await run('<div @(cond(), title="x" @click="f()" @(inner(), id="y"))></div>');
      const output = code.join('\n');

      expect(output).toContain('condition: () => this.cond(),');
      expect(output).toContain('attributes: [');
      expect(output).toContain('events: [');
      expect(output).toContain('dynamicBindings: [');
      expect(output).toContain('unbind: _removeAttribute');
    });

    it('generates empty attribute, event and nested lists when absent', async () => {
      const { code } = await run('<div @(cond(), @(inner(), id="y"))></div>');
      const output = code.join('\n');

      expect(output).toContain('attributes: [],');
      expect(output).toContain('events: [],');
      expect(output).toContain('dynamicBindings: []');
    });

    it('uses the component metadata to describe known optional properties', async () => {
      const context = new CompilerContext();
      context.cache = cacheWith({ title: new ComponentPropertyMetadata('title', 'string', { required: false, defaultValue: '\'d\'' }) });
      const { code } = await run('<my-el @(cond(), title="x")></my-el>', context);
      const output = code.join('\n');

      expect(output).toContain('unbind: _setExpressionProperty,');
      expect(output).toContain('defaultValue: \'d\'');
    });

    it('does not add unbind information for required properties', async () => {
      const context = new CompilerContext();
      context.cache = cacheWith({ title: new ComponentPropertyMetadata('title', 'string', { required: true }) });
      const { code } = await run('<my-el @(cond(), title="x")></my-el>', context);

      expect(code.join('\n')).not.toContain('unbind');
    });
  });
});
