// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest';
import { DIRECTIVE_ORDER, HEADER } from '../../costants';
import { HostAttribute } from '../../decorators/host-attribute/host-attribute.decorator';
import { CustomDirective } from '../../models/custom-directive/custom-directive';
import type { _Context } from '../../types/context.type';
import type { RenderElementAttribute } from '../../types/render-element-attribute.type';
import type { RenderElementConditionalBinding } from '../../types/render-element-conditional-binding.type';
import type { RenderElement } from '../../types/render-element.type';
import type { _ScopeLayout } from '../../types/scope-layout.type';
import { _hasAttributeState, _mergeAttributes } from '../attribute-state/attribute-state.util';
import { _scope, clear, EMPTY_LAYOUT, refresh, update } from '../context/context.util';
import { _defineDirective } from '../directive-registry/directive-registry.util';
import { _applyHostAttributes, _bindHost } from '../host-bindings/host-bindings.util';
import { _removeAttribute, _setExpressionProperty, RenderElementAttributeTemplateValue } from '../render-element/render-element.util';
import { _prepareAttributes, _setAttribute, _setExpressionAttribute, _setReactiveAttribute, removeTemplateAttribute, writeTemplateAttribute } from './attribute-binding.util';

await vi.hoisted(async () => {
  const { loadSignals } = await import('@xaendar/signals');
  loadSignals();
});

const { signal } = await import('../../signals/signal/signal');
const { input } = await import('../../signals/input/input');
const { CustomElement } = await import('../../models/custom-element/custom-element');

const flush = () => new Promise<void>(resolve => queueMicrotask(resolve));

/**
 * Builds the metadata of a class declaring host attributes, as its decorators would.
 */
function metadataOf(properties: Record<string, string>, members: Record<string, unknown>): DecoratorMetadataObject {
  const metadata: DecoratorMetadataObject = {};
  for (const [member, name] of Object.entries(properties)) {
    (HostAttribute(name) as unknown as (value: undefined, context: unknown) => void)(undefined, { kind: 'field', name: member, static: false, metadata, access: { get: () => members[member] } });
  }

  return metadata;
}

/**
 * Creates the class of a directive declaring host attributes.
 */
function directiveOf(properties: Record<string, string>, members: Record<string, unknown>): new () => CustomDirective {
  const Directive = class extends CustomDirective { };
  Object.defineProperty(Directive, Symbol.for('Symbol.metadata'), { value: metadataOf(properties, members) });
  return Directive;
}

/**
 * Binds the host attributes of a directive on an element, with its order among the directives of the element.
 */
function bindDirective(element: Element, Directive: new () => CustomDirective, order: number): _Context {
  const directive = new Directive();
  directive[DIRECTIVE_ORDER] = order;
  const context = _scope(null, EMPTY_LAYOUT);
  _bindHost(directive, element, context);
  return context;
}

/**
 * Binds host attributes as the component the element is: the owner is the element itself.
 */
function bindComponent(element: Element, properties: Record<string, string>, members: Record<string, unknown>): _Context {
  Object.defineProperty(element, 'constructor', { value: { [Symbol.for('Symbol.metadata')]: metadataOf(properties, members) } });
  const context = _scope(null, EMPTY_LAYOUT);
  _bindHost(element as unknown as CustomDirective, element, context);
  return context;
}

/**
 * Describes an attribute written with `attr.`, merged with the other sources of the element.
 */
const sharedOf = (name: string, value: RenderElementAttribute['value']): RenderElementAttribute => ({ name, value, setter: _setReactiveAttribute, shared: true });

/**
 * Describes a `div` of a template.
 */
const elementOf = (members: Omit<RenderElement, 'tagName'>): RenderElement => ({ tagName: 'div', ...members });

/**
 * Describes the branch of a conditional binding applying a directive.
 */
const branchApplying = (selector: string): RenderElementConditionalBinding[] => [{ branches: [{ condition: () => false, directives: [{ selector }] }] }];

/**
 * Creates the states of attributes, as for an element a branch of which applies a directive not registered yet, which
 * may write any of them.
 */
const prepareAll = (element: Element, shared: string[]) => _prepareAttributes(element, elementOf({ shared, sharedAlways: true, conditionalBindings: branchApplying('not-registered-yet') }));

describe('attributes written with attr.', () => {
  it('write the attribute of a component, never its input of the same name', async () => {
    const element = document.createElement('div') as unknown as Omit<HTMLElement, 'title'> & { title: unknown };
    Object.defineProperty(element, 'title', { value: input<string>('input'), writable: true });
    const title = element.title as () => string;
    _setAttribute(_scope(null, EMPTY_LAYOUT), element, { name: 'title', value: 'static', setter: _setAttribute });
    expect(element.getAttribute('title')).toBe('static');

    _setExpressionAttribute(_scope(null, EMPTY_LAYOUT), element, { name: 'title', value: () => 'once', setter: _setExpressionAttribute });
    expect(element.getAttribute('title')).toBe('once');

    const hint = signal('reactive');
    _setReactiveAttribute(_scope(null, EMPTY_LAYOUT), element, { name: 'title', value: () => hint(), setter: _setReactiveAttribute });
    expect(element.getAttribute('title')).toBe('reactive');
    hint.set('changed');
    await flush();
    expect(element.getAttribute('title')).toBe('changed');
    expect(title()).toBe('input');
  });

  it('run again when a variable of the template they read changes', () => {
    const layout: _ScopeLayout = { size: HEADER + 1, nodes: HEADER + 1, variables: ['kind'] };
    const scope = _scope(null, layout);
    scope[HEADER] = 'a';
    const element = document.createElement('div');
    _setReactiveAttribute(scope, element, { name: 'data-kind', value: context => context[HEADER], setter: _setReactiveAttribute, reads: [0] });
    expect(element.getAttribute('data-kind')).toBe('a');

    update(scope, HEADER, 'b');
    refresh(scope, [0]);
    expect(element.getAttribute('data-kind')).toBe('b');
  });
});

describe('merging the template, the directives and the component', () => {
  it('lets the template win over the component, whatever binds first, and gives back the value of the component for null', async () => {
    for (const templateFirst of [true, false]) {
      const element = document.createElement('div');
      const id = signal<string | null>('template');
      const attribute = sharedOf('id', () => id());
      const scope = _scope(null, EMPTY_LAYOUT);
      prepareAll(element, ['id']);
      templateFirst && _setReactiveAttribute(scope, element, attribute);
      const component = bindComponent(element, { id: 'id' }, { id: 'component' });
      templateFirst || _setReactiveAttribute(scope, element, attribute);
      expect(element.getAttribute('id')).toBe('template');

      id.set(null);
      await flush();
      expect(element.getAttribute('id')).toBe('component');

      id.set('again');
      await flush();
      clear(component);
      expect(element.getAttribute('id')).toBe('again');
    }
  });

  it('lets the template win over a directive, the component coming back once the directive is destroyed, the template staying', async () => {
    const element = document.createElement('div');
    bindComponent(element, { id: 'id' }, { id: 'component' });
    prepareAll(element, ['id']);
    const template = signal<string | null>(null);
    _setReactiveAttribute(_scope(null, EMPTY_LAYOUT), element, sharedOf('id', () => template()));
    const directive = bindDirective(element, directiveOf({ id: 'id' }, { id: 'directive' }), 0);
    expect(element.getAttribute('id')).toBe('directive');

    clear(directive);
    expect(element.getAttribute('id')).toBe('component');

    template.set('template');
    await flush();
    const other = bindDirective(element, directiveOf({ id: 'id' }, { id: 'other' }), 0);
    expect(element.getAttribute('id')).toBe('template');
    clear(other);
    expect(element.getAttribute('id')).toBe('template');
  });

  it('removes for false an attribute the component writes, but writes "false" on aria-* and enumerated attributes', () => {
    const element = document.createElement('div');
    prepareAll(element, ['hidden', 'aria-expanded', 'spellcheck']);
    bindComponent(element, { hidden: 'hidden', expanded: 'aria-expanded', spellcheck: 'spellcheck' }, { hidden: true, expanded: true, spellcheck: true });
    const scope = _scope(null, EMPTY_LAYOUT);
    _setExpressionAttribute(scope, element, sharedOf('hidden', () => false));
    _setExpressionAttribute(scope, element, sharedOf('aria-expanded', () => false));
    _setExpressionProperty(scope, element, sharedOf('spellcheck', () => false) as RenderElementAttributeTemplateValue);
    expect(element.hasAttribute('hidden')).toBe(false);
    expect(element.getAttribute('aria-expanded')).toBe('false');
    expect(element.getAttribute('spellcheck')).toBe('false');
  });

  it('gives back the value below when the branch binding the attribute is no longer selected', () => {
    const element = document.createElement('div');
    prepareAll(element, ['title']);
    bindComponent(element, { title: 'title' }, { title: 'component' });
    const attribute: RenderElementAttribute = { name: 'title', value: 'branch', setter: _setAttribute, unbind: _removeAttribute, shared: true };
    const scope = _scope(null, EMPTY_LAYOUT);
    _setAttribute(scope, element, attribute);
    expect(element.getAttribute('title')).toBe('branch');

    _removeAttribute(scope, element, attribute);
    expect(element.getAttribute('title')).toBe('component');
  });

  it('writes an attribute no other level writes directly, without state, as most of them', () => {
    const element = document.createElement('div');
    writeTemplateAttribute(element, { name: 'title', value: 'a', setter: _setAttribute }, 'a');
    expect(element.getAttribute('title')).toBe('a');
    expect(_hasAttributeState(element, 'title')).toBe(false);

    // A shared attribute whose element has no state, its levels not writing it, is written and removed directly too
    const shared = sharedOf('lang', 'it');
    writeTemplateAttribute(element, shared, 'it');
    expect(element.getAttribute('lang')).toBe('it');
    removeTemplateAttribute(element, shared);
    expect(element.hasAttribute('lang')).toBe(false);
    removeTemplateAttribute(element, { name: 'title', value: 'a', setter: _setAttribute });
    expect(element.hasAttribute('title')).toBe(false);
  });

  it('keeps no state for an attribute a single level writes, on an element whose other attributes are merged', () => {
    _defineDirective('mergeOne', directiveOf({ id: 'id', role: 'role' }, { id: 'directive', role: 'note' }));
    const element = document.createElement('div');
    _prepareAttributes(element, elementOf({ shared: ['id', 'title'], directives: [{ selector: 'mergeOne' }] }));
    const scope = _scope(null, EMPTY_LAYOUT);
    _setExpressionAttribute(scope, element, sharedOf('id', () => 'template'));
    _setExpressionAttribute(scope, element, sharedOf('title', () => 'title'));
    const directive = bindDirective(element, directiveOf({ id: 'id', role: 'role' }, { id: 'directive', role: 'note' }), 0);
    expect([element.getAttribute('id'), element.getAttribute('title'), element.getAttribute('role')]).toEqual(['template', 'title', 'note']);
    expect([_hasAttributeState(element, 'id'), _hasAttributeState(element, 'title'), _hasAttributeState(element, 'role')]).toEqual([true, false, false]);

    clear(directive);
    expect([element.getAttribute('id'), element.getAttribute('title'), element.hasAttribute('role')]).toEqual(['template', 'title', false]);
  });

  it('keeps no state, on an element merging all its attributes, for the ones a single level writes, whatever writes first', () => {
    const Directive = directiveOf({ id: 'id', role: 'role' }, { id: 'directive', role: 'note' });
    for (const templateFirst of [true, false]) {
      const element = document.createElement('div');
      _mergeAttributes(element);
      const write = () => {
        writeTemplateAttribute(element, { name: 'id', value: 'template', setter: _setAttribute }, 'template');
        writeTemplateAttribute(element, { name: 'title', value: 'title', setter: _setAttribute }, 'title');
      };
      templateFirst && write();
      _applyHostAttributes(new Directive(), element);
      templateFirst || write();
      expect([element.getAttribute('id'), element.getAttribute('title'), element.getAttribute('role')]).toEqual(['template', 'title', 'note']);
      expect([_hasAttributeState(element, 'id'), _hasAttributeState(element, 'title'), _hasAttributeState(element, 'role')]).toEqual([true, false, false]);
    }
  });
});

describe('_prepareAttributes', () => {
  it('creates the states the directives of the branches may need, every one for a directive not registered yet', () => {
    const element = document.createElement('div');
    prepareAll(element, ['id', 'title']);
    expect(_hasAttributeState(element, 'id')).toBe(true);
    expect(_hasAttributeState(element, 'title')).toBe(true);

    // A registered one only the ones it declares, nested branches included
    _defineDirective('branchTitle', directiveOf({ title: 'title' }, {}));
    _defineDirective('branchNothing', directiveOf({}, {}));
    const declared = document.createElement('div');
    const nested: RenderElementConditionalBinding[] = [{ branches: [{ condition: () => false, directives: [{ selector: 'branchNothing' }], conditionalBindings: branchApplying('branchTitle') }, { condition: () => false }] }];
    _prepareAttributes(declared, elementOf({ shared: ['id', 'title'], sharedAlways: true, conditionalBindings: nested }));
    expect(_hasAttributeState(declared, 'title')).toBe(true);
    expect(_hasAttributeState(declared, 'id')).toBe(false);

    // A directive applied by its class
    const byClass = document.createElement('div');
    _prepareAttributes(byClass, elementOf({ shared: ['title'], sharedAlways: true, conditionalBindings: [{ branches: [{ condition: () => false, directives: [{ selector: directiveOf({ title: 'title' }, {}) }] }] }] }));
    expect(_hasAttributeState(byClass, 'title')).toBe(true);
  });

  it('creates the states of the attributes the directives of the element write with their host attributes, none on a native element', () => {
    _defineDirective('prepareAttributes', directiveOf({ id: 'id' }, {}));
    _defineDirective('prepareNothing', directiveOf({ kind: 'class' }, {}));
    const element = document.createElement('div');
    _prepareAttributes(element, elementOf({ shared: ['id', 'title'], directives: [{ selector: 'prepareNothing' }, { selector: 'prepareAttributes' }] }));
    expect(_hasAttributeState(element, 'id')).toBe(true);
    expect(_hasAttributeState(element, 'title')).toBe(false);

    const native = document.createElement('div');
    _prepareAttributes(native, elementOf({ shared: ['id'] }));
    expect(_hasAttributeState(native, 'id')).toBe(false);
  });

  it('creates every state on a custom element not defined yet, the ones its component writes on a defined one', () => {
    const pending = document.createElement('x-attributes-not-defined');
    _prepareAttributes(pending, elementOf({ shared: ['id', 'title'] }));
    expect(_hasAttributeState(pending, 'id')).toBe(true);
    expect(_hasAttributeState(pending, 'title')).toBe(true);

    const Component = class extends CustomElement { };
    Object.defineProperty(Component, Symbol.for('Symbol.metadata'), { value: metadataOf({ title: 'title' }, {}) });
    customElements.define('x-prepare-attributes', Component);
    const element = document.createElement('x-prepare-attributes');
    _prepareAttributes(element, elementOf({ shared: ['id', 'title'] }));
    expect(_hasAttributeState(element, 'id')).toBe(false);
    expect(_hasAttributeState(element, 'title')).toBe(true);
  });
});
