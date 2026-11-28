// @vitest-environment happy-dom
import { loadSignals } from '@xaendar/signals';
import { describe, expect, it, vi } from 'vitest';
import { INTERNAL_ATTRIBUTE_INPUTS } from '../../costants';
import { input } from '../../signals/input/input';
import { INPUT_SIGNAL_SET_SYMBOL } from '../../signals/input/input-set.symbol';
import type { InputSignal } from '../../signals/types/input-signal.type';
import type { WebComponentMetadata } from '../../types/web-component/web-component-metadata.type';
import { _applyAttributeInputs, _removeAttributeInput, _setAttributeInput, attributeNameOf, registerAttributeInput, toBooleanInput, toNumberInput, toStringInput } from './attribute-inputs.util';

loadSignals();

let counter = 0;

/**
 * Defines a custom element whose inputs `inputs` gives, each with its default value, registered as written by the
 * attributes `attributes` names, then given what `@WebComponent` gives it.
 */
function define(inputs: Record<string, unknown>, attributes: Record<string, { property: string, option?: unknown, transforms?: boolean, reflects?: boolean }>, base: CustomElementConstructor = HTMLElement): { name: string, klass: CustomElementConstructor, metadata: WebComponentMetadata } {
  const metadata = {} as WebComponentMetadata;
  const signals = new WeakMap<object, Record<string, InputSignal<unknown>>>();
  const klass = class extends (base as typeof HTMLElement) { };
  for (const property in inputs) {
    Object.defineProperty(klass.prototype, property, {
      get(this: object) {
        let own = signals.get(this);
        if (!own) {
          own = {};
          signals.set(this, own);
        }

        return own[property] ??= input(inputs[property]);
      }
    });
  }

  for (const name in attributes) {
    const { property, option = true, transforms = false, reflects = false } = attributes[name];
    registerAttributeInput(metadata, property, name, option, inputs[property], transforms, reflects);
  }

  Object.defineProperty(klass, Symbol.for('Symbol.metadata'), { value: metadata });
  _applyAttributeInputs(klass);
  const tag = `x-attribute-${counter++}`;
  customElements.define(tag, klass);
  return { name: tag, klass, metadata };
}

type Element = HTMLElement & Record<string, InputSignal<unknown>>;

describe('attributeNameOf', () => {
  it('names the attribute after the string given, or after the alias or the property in kebab-case', () => {
    expect(attributeNameOf('data-size', 'size', undefined)).toBe('data-size');
    expect(attributeNameOf(true, 'showValue', undefined)).toBe('show-value');
    expect(attributeNameOf(() => 1, 'size', 'userSize')).toBe('user-size');
  });
});

describe('converters', () => {
  it('converts a boolean, a number and a string attribute', () => {
    expect(toBooleanInput()).toBe(true);
    expect(toNumberInput('3.5')).toBe(3.5);
    expect(toNumberInput('abc')).toBeNaN();
    expect(toStringInput('a b')).toBe('a b');
  });
});

describe('registerAttributeInput', () => {
  it('deduces the conversion from the default value, or takes the function given', () => {
    const metadata = {} as WebComponentMetadata;
    const convert = (value: string) => value.length;
    registerAttributeInput(metadata, 'open', 'open', true, false, false, true);
    registerAttributeInput(metadata, 'size', 'size', true, 0, false, false);
    registerAttributeInput(metadata, 'label', 'label', 'label', '', false, false);
    registerAttributeInput(metadata, 'since', 'since', convert, null, true, false);

    expect(metadata[INTERNAL_ATTRIBUTE_INPUTS]).toEqual({
      open: { property: 'open', convert: toBooleanInput, reflects: true },
      size: { property: 'size', convert: toNumberInput, reflects: false },
      label: { property: 'label', convert: toStringInput, reflects: false },
      since: { property: 'since', convert, reflects: false }
    });
  });

  it('adds the inputs of a class to the ones of its parent, leaving the parent untouched', () => {
    const parent = {} as WebComponentMetadata;
    registerAttributeInput(parent, 'open', 'open', true, false, false, false);
    const child = Object.create(parent) as WebComponentMetadata;
    registerAttributeInput(child, 'size', 'size', true, 0, false, false);

    expect(Object.keys(parent[INTERNAL_ATTRIBUTE_INPUTS]!)).toEqual(['open']);
    expect(Object.keys(child[INTERNAL_ATTRIBUTE_INPUTS]!)).toEqual(['open', 'size']);
  });

  it('throws without a function for a transform or a default that is not a boolean, a number or a string', () => {
    expect(() => registerAttributeInput({}, 'size', 'size', true, 0, true, false)).toThrow('@Property on size is written by the attribute "size" and declares a transform: give attribute a function converting the text of the attribute into the value transform takes');
    expect(() => registerAttributeInput({}, 'since', 'since', true, undefined, false, false)).toThrow('@Property on since is written by the attribute "since", whose text cannot be converted from a default value that is not a boolean, a number or a string');
  });
});

describe('_applyAttributeInputs', () => {
  it('writes the inputs from the attributes, converted, and resets them once the attribute is removed', () => {
    const { name } = define({ open: false, size: 0, label: 'none' }, { open: { property: 'open' }, 'data-size': { property: 'size' }, label: { property: 'label' } });
    const element = document.createElement(name) as Element;

    element.setAttribute('open', 'false');
    element.setAttribute('data-size', '4');
    element.setAttribute('label', 'Ada');
    element.setAttribute('other', 'x');
    expect([element.open(), element.size(), element.label()]).toEqual([true, 4, 'Ada']);

    element.removeAttribute('open');
    element.removeAttribute('data-size');
    expect([element.open(), element.size()]).toEqual([false, 0]);
  });

  it('adds the attributes to the ones the class observes, calling its own callback after writing the input', () => {
    const heard = vi.fn();
    class Observing extends HTMLElement {
      public static observedAttributes = ['mode'];

      public attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void {
        heard(name, oldValue, newValue, (this as unknown as Element).size());
      }
    }
    const { klass, name } = define({ size: 0 }, { size: { property: 'size' } }, Observing);
    const element = document.createElement(name);
    element.setAttribute('size', '2');
    element.setAttribute('mode', 'dark');

    expect((klass as unknown as { observedAttributes: string[] }).observedAttributes).toEqual(['mode', 'size']);
    expect(heard.mock.calls).toEqual([['size', null, '2', 2], ['mode', null, 'dark', 2]]);
  });

  it('gives a subclass the callback of its parent, adding the attributes of its own inputs', () => {
    const { klass: Parent } = define({ size: 0 }, { size: { property: 'size' } });
    const { klass: Child, name } = define({ size: 0, open: false }, { size: { property: 'size' }, open: { property: 'open' } }, Parent);
    const element = document.createElement(name) as Element;
    element.setAttribute('open', '');

    expect(Child.prototype.attributeChangedCallback).toBe(Parent.prototype.attributeChangedCallback);
    expect(element.open()).toBe(true);
  });

  it('leaves an input reflected on the attribute as it is when the attribute holds its reflection', () => {
    const { name } = define({ label: '' }, { label: { property: 'label', option: (value: string) => value.trim(), reflects: true } });
    const element = document.createElement(name) as Element;
    const set = vi.spyOn(element.label as unknown as { set: () => void }, 'set');

    element.setAttribute('label', ' Ada ');
    (element.label as unknown as { set(value: unknown, symbol: symbol): void }).set('Bob', INPUT_SIGNAL_SET_SYMBOL);
    set.mockClear();
    element.setAttribute('label', 'Bob');

    expect(set).not.toHaveBeenCalled();
    expect(element.label()).toBe('Bob');
  });

  it('does nothing for a class with no input written by an attribute', () => {
    const klass = class extends HTMLElement { };
    _applyAttributeInputs(klass);

    expect(Object.hasOwn(klass, 'observedAttributes')).toBe(false);
  });
});

describe('_setAttributeInput and _removeAttributeInput', () => {
  it('write the attribute of the input, only when it differs, and remove it', () => {
    const { name } = define({ size: 0 }, { size: { property: 'size' } });
    const element = document.createElement(name) as Element;
    const setAttribute = vi.spyOn(element, 'setAttribute');

    _setAttributeInput(null, element, { name: 'size', value: '3' } as never);
    expect(setAttribute).toHaveBeenCalledTimes(1);
    expect(element.size()).toBe(3);

    // An attribute holding the value already, as the one of the server, is written into the input without the DOM
    const adopted = document.createElement(name) as Element;
    adopted.setAttribute('size', '5');
    (adopted.size as unknown as { set(value: unknown, symbol: symbol): void }).set(0, INPUT_SIGNAL_SET_SYMBOL);
    const write = vi.spyOn(adopted, 'setAttribute');
    _setAttributeInput(null, adopted, { name: 'size', value: '5' } as never);
    expect(write).not.toHaveBeenCalled();
    expect(adopted.size()).toBe(5);

    _removeAttributeInput(null, element, { name: 'size', value: '3' } as never);
    expect(element.hasAttribute('size')).toBe(false);
    expect(element.size()).toBe(0);
  });
});
