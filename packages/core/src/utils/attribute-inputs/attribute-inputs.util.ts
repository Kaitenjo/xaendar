import { toKebabCase } from '@xaendar/common';
import { INTERNAL_ATTRIBUTE_INPUTS } from '../../costants';
import { INPUT_SIGNAL_SET_SYMBOL } from '../../signals/input/input-set.symbol';
import type { SettableInputSignal } from '../../signals/types/settable-input-signal.type';
import type { AttributeChangedCallback } from '../../types/property/attribute-changed-callback.type';
import type { RenderElementAttribute } from '../../types/render-element-attribute.type';
import type { AttributeInput } from '../../types/property/attribute-input.type';
import type { WebComponentMetadata } from '../../types/web-component/web-component-metadata.type';
import { getWebComponentMetadata } from '../get-metadata/get-metadata.util';
import { _attributeValue } from '../write-attribute/write-attribute.util';

/**
 * The `attributeChangedCallback` of the classes `@WebComponent` gives one, its own or the one wrapping the callback the
 * class declares (see {@link _applyAttributeInputs}), so that a subclass inheriting one is not given another.
 */
const FRAMEWORK_CALLBACKS = new WeakSet<AttributeChangedCallback>();

/**
 * The name of the attribute an input reflects on or is written by, `reflect` or `attribute` of `@Property`: the string
 * given, or the alias of the input, or the name of its property, in kebab-case.
 *
 * @param option - The option.
 * @param propertyKey - The name of the property of the input.
 * @param alias - Its alias, if any.
 * @returns The name of the attribute.
 */
export function attributeNameOf(option: unknown, propertyKey: string, alias: string | undefined): string {
  return typeof option === 'string' ? option : toKebabCase(alias ?? propertyKey);
}

/**
 * Registers in the metadata of its class an input an attribute writes, `attribute` of `@Property`, with the conversion
 * of the text of the attribute: the function given, or the one deduced from the type of the default value.
 *
 * The map of the parent class is copied into the metadata of the class before it changes, so the inputs of the parent
 * stay and the ones of the class do not reach the parent.
 *
 * @param metadata - The metadata of the class declaring the input.
 * @param propertyKey - The name of the property of the input.
 * @param name - The name of the attribute.
 * @param option - The `attribute` option.
 * @param defaultValue - The default value of the input, `undefined` for a required one.
 * @param transforms - Whether the input declares a `transform`, which the deduced conversions do not know.
 * @param reflects - Whether the input is reflected on the same attribute.
 * @throws If the input gives no function and its default is not a boolean, a number or a string, or it declares a
 *   `transform`.
 */
export function registerAttributeInput(metadata: Partial<WebComponentMetadata>, propertyKey: string, name: string, option: unknown, defaultValue: unknown, transforms: boolean, reflects: boolean): void {
  const convert = typeof option === 'function' ? option as AttributeInput['convert'] : deduceConversion(propertyKey, name, defaultValue, transforms);
  if (!Object.hasOwn(metadata, INTERNAL_ATTRIBUTE_INPUTS)) {
    metadata[INTERNAL_ATTRIBUTE_INPUTS] = Object.assign({}, metadata[INTERNAL_ATTRIBUTE_INPUTS]);
  }

  metadata[INTERNAL_ATTRIBUTE_INPUTS]![name] = { property: propertyKey, convert, reflects };
}

/**
 * Gives the class of a component, before it is defined, what the browser needs to write its inputs from its attributes:
 * the static `observedAttributes`, the names of the attributes of its inputs added to the ones the class observes by
 * itself, and an `attributeChangedCallback` writing them. A callback the class declares is kept, called after the input
 * is written, so the class still hears every attribute it observes; one the framework gave a parent class is inherited.
 *
 * @param klass - The class of the component.
 */
export function _applyAttributeInputs(klass: object): void {
  const inputs = getWebComponentMetadata(klass)?.[INTERNAL_ATTRIBUTE_INPUTS];
  if (!inputs) {
    return;
  }

  const component = klass as { observedAttributes?: Iterable<string>, prototype: { attributeChangedCallback?: AttributeChangedCallback } };
  const observed = new Set(component.observedAttributes);
  for (const name in inputs) {
    observed.add(name);
  }

  Object.defineProperty(klass, 'observedAttributes', { configurable: true, value: Array.from(observed) });
  const declared = component.prototype.attributeChangedCallback;
  if (declared && FRAMEWORK_CALLBACKS.has(declared)) {
    return;
  }

  const callback = declared ? wrapAttributeChanged(declared) : onAttributeChanged;
  FRAMEWORK_CALLBACKS.add(callback);
  Object.defineProperty(component.prototype, 'attributeChangedCallback', { configurable: true, writable: true, value: callback });
}

/**
 * Writes a static value of a template into an input an attribute writes: into the attribute, whose change the component
 * converts, as a browser writing the attribute of the HTML of a page, before the class is defined too. An attribute
 * holding it already, as on an element adopted from the HTML of the server, is not written again: its text is written
 * into the input straight away, which an element whose class is not defined yet gets from the browser when upgraded.
 *
 * @param _context - The current template execution scope.
 * @param element - The element of the component.
 * @param attribute - The attribute, by its name, and the text of the template.
 */
export function _setAttributeInput(_context: unknown, element: Element, attribute: RenderElementAttribute): void {
  const { name, value } = attribute;
  element.getAttribute(name) === value ? writeAttributeInput(element, name, value) : element.setAttribute(name, value as string);
}

/**
 * Removes the attribute writing an input, when the branch binding it is no longer selected: the input goes back to its
 * default.
 *
 * @param _context - The current template execution scope.
 * @param element - The element of the component.
 * @param attribute - The attribute, by its name.
 */
export function _removeAttributeInput(_context: unknown, element: Element, attribute: RenderElementAttribute): void {
  element.removeAttribute(attribute.name);
}

/**
 * Converts a boolean attribute: `true` while it is present, whatever its text, as `disabled="false"` disables a button.
 *
 * @returns `true`.
 */
export function toBooleanInput(): boolean {
  return true;
}

/**
 * Converts a number attribute.
 *
 * @param value - The text of the attribute.
 * @returns The number, `NaN` for a text that is not one.
 */
export function toNumberInput(value: string): number {
  return Number(value);
}

/**
 * Converts a string attribute: its text, as it is.
 *
 * @param value - The text of the attribute.
 * @returns The text.
 */
export function toStringInput(value: string): string {
  return value;
}

/**
 * Deduces how the text of an attribute is converted from the type of the default value of its input.
 *
 * @param propertyKey - The name of the property of the input.
 * @param name - The name of the attribute.
 * @param defaultValue - The default value.
 * @param transforms - Whether the input declares a `transform`.
 * @returns The conversion.
 * @throws If the input declares a `transform`, or its default is not a boolean, a number or a string.
 */
function deduceConversion(propertyKey: string, name: string, defaultValue: unknown, transforms: boolean): AttributeInput['convert'] {
  if (transforms) {
    throw new Error(`@Property on ${propertyKey} is written by the attribute "${name}" and declares a transform: give attribute a function converting the text of the attribute into the value transform takes`);
  }

  switch (typeof defaultValue) {
    case 'boolean':
      return toBooleanInput;

    case 'number':
      return toNumberInput;

    case 'string':
      return toStringInput;

    default:
      throw new Error(`@Property on ${propertyKey} is written by the attribute "${name}", whose text cannot be converted from a default value that is not a boolean, a number or a string: give attribute a function converting it, e.g. attribute: value => new Date(value)`);
  }
}

/**
 * The `attributeChangedCallback` of a component whose class declares none: writes the input of the attribute.
 *
 * @param name - The name of the attribute.
 * @param _oldValue - Its previous text.
 * @param newValue - Its text, `null` once removed.
 */
function onAttributeChanged(this: Element, name: string, _oldValue: string | null, newValue: string | null): void {
  writeAttributeInput(this, name, newValue);
}

/**
 * Wraps the `attributeChangedCallback` a class declares, so that the input of the attribute is written first.
 *
 * @param declared - The callback of the class.
 * @returns The callback the class is given, calling it.
 */
function wrapAttributeChanged(declared: AttributeChangedCallback): AttributeChangedCallback {
  return function (this: Element, name: string, oldValue: string | null, newValue: string | null): void {
    writeAttributeInput(this, name, newValue);
    declared.call(this, name, oldValue, newValue);
  };
}

/**
 * Writes the input an attribute of a component writes, as an assignment from outside, through its `transform` and its
 * `equals`: the converted text, or the default once the attribute is removed. An input reflected on the attribute is
 * left as it is when the attribute holds the reflection of its value, which is the reflection writing it.
 *
 * @param element - The element of the component.
 * @param name - The name of the attribute.
 * @param value - The text of the attribute, `null` once removed.
 */
function writeAttributeInput(element: Element, name: string, value: string | null): void {
  const entry = getWebComponentMetadata(element.constructor)?.[INTERNAL_ATTRIBUTE_INPUTS]?.[name];
  if (!entry) {
    return;
  }

  const input = (element as unknown as Record<string, SettableInputSignal<unknown>>)[entry.property];
  if (entry.reflects && _attributeValue(name, input()) === value) {
    return;
  }

  value === null ? input.reset(INPUT_SIGNAL_SET_SYMBOL) : input.set(entry.convert(value), INPUT_SIGNAL_SET_SYMBOL);
}
