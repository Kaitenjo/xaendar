// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest';
import { HostProperty } from '../../decorators/host-property/host-property.decorator';
import { CustomDirective } from '../../models/custom-directive/custom-directive';
import type { RenderElementAttribute } from '../../types/render-element-attribute.type';
import { toggleClass } from '../class-toggle/class-toggle.util';
import { _Context } from '../context/context.util';
import { _bindHost } from '../host-bindings/host-bindings.util';
import { _setExpressionProperty, _setProperty } from '../render-element/render-element.util';
import { _attributeValue, writeAttribute } from './write-attribute.util';

await vi.hoisted(async () => {
  const { loadSignals } = await import('@xaendar/signals');
  loadSignals();
});

/**
 * The values of a binding the tests write.
 */
const VALUES: readonly unknown[] = [null, undefined, true, false, 'text'];

/**
 * An attribute of each kind: a boolean or plain one, an `aria-*` one, an enumerated one.
 */
const NAMES: readonly string[] = ['hidden', 'aria-expanded', 'draggable'];

/**
 * Writes a value through a binding of a template, returning the attribute the element holds.
 */
function throughTemplate(name: string, value: unknown): string | null {
  const element = document.createElement('div');
  const attribute: RenderElementAttribute = { name, value: () => value, setter: _setProperty };
  _setExpressionProperty(new _Context({} as never), element, attribute);
  return element.getAttribute(name);
}

/**
 * Writes a value through a `@HostProperty` of a directive, returning the attribute its host element holds.
 */
function throughHostProperty(name: string, value: unknown): string | null {
  const metadata: DecoratorMetadataObject = {};
  (HostProperty(name) as unknown as (value: undefined, context: unknown) => void)(undefined, { kind: 'field', name: 'member', static: false, metadata, access: { get: () => value } });
  const Klass = class extends CustomDirective { };
  Object.defineProperty(Klass, Symbol.for('Symbol.metadata'), { value: metadata });
  const element = document.createElement('div');
  _bindHost(new Klass(), element, new _Context({} as never));
  return element.getAttribute(name);
}

describe('_attributeValue', () => {
  it('removes the attribute for null and undefined, whatever the attribute', () => {
    for (let i = 0; i < NAMES.length; i++) {
      expect(_attributeValue(NAMES[i], null)).toBeNull();
      expect(_attributeValue(NAMES[i], undefined)).toBeNull();
    }
  });

  it('adds an attribute empty for true and removes it for false', () => {
    expect(_attributeValue('hidden', true)).toBe('');
    expect(_attributeValue('hidden', false)).toBeNull();
    expect(_attributeValue('title', false)).toBeNull();
  });

  it('writes true and false as text on an aria-* attribute and on an enumerated one', () => {
    expect(_attributeValue('aria-expanded', true)).toBe('true');
    expect(_attributeValue('aria-expanded', false)).toBe('false');
    expect(_attributeValue('ARIA-Hidden', false)).toBe('false');
    expect(_attributeValue('draggable', false)).toBe('false');
    expect(_attributeValue('spellcheck', true)).toBe('true');
    expect(_attributeValue('contentEditable', false)).toBe('false');
    expect(_attributeValue('writingsuggestions', false)).toBe('false');
  });

  it('writes any other value with String', () => {
    expect(_attributeValue('title', 'text')).toBe('text');
    expect(_attributeValue('tabindex', 0)).toBe('0');
    expect(_attributeValue('aria-valuenow', 3)).toBe('3');
    expect(_attributeValue('title', { toString: () => 'object' })).toBe('object');
  });
});

describe('writeAttribute', () => {
  it('writes the value only when it differs, removing the attribute for the values that remove it', () => {
    const element = document.createElement('div');
    const setAttribute = vi.spyOn(element, 'setAttribute');

    writeAttribute(element, 'aria-expanded', false);
    writeAttribute(element, 'aria-expanded', 'false');
    expect(setAttribute).toHaveBeenCalledOnce();
    expect(element.getAttribute('aria-expanded')).toBe('false');

    writeAttribute(element, 'aria-expanded', null);
    expect(element.hasAttribute('aria-expanded')).toBe(false);
  });

  it('keeps the classes toggled on the element when it writes class', () => {
    const element = document.createElement('div');
    toggleClass(element, 'selected', true);

    writeAttribute(element, 'class', 'card');

    expect(element.className).toBe('card selected');
  });

  it('writes the same attribute in a template and through @HostProperty, for every value and every kind of attribute', () => {
    const expected: Record<string, Array<string | null>> = {
      'hidden': [null, null, '', null, 'text'],
      'aria-expanded': [null, null, 'true', 'false', 'text'],
      'draggable': [null, null, 'true', 'false', 'text']
    };

    for (let i = 0; i < NAMES.length; i++) {
      const name = NAMES[i];
      expect(VALUES.map(value => throughTemplate(name, value))).toEqual(expected[name]);
      expect(VALUES.map(value => throughHostProperty(name, value))).toEqual(expected[name]);
    }
  });
});
