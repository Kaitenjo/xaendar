import { type ComponentMetadata, type ComponentOrDirectiveMetadata, parseTemplate, type SymbolImport } from '@xaendar/compiler';
import { describe, expect, it } from 'vitest';
import { getTemplateUsage } from './template-usage';

const child = { type: 'component', selector: 'x-child', properties: new Map([['label', {}], ['size', {}]]) } as unknown as ComponentMetadata;
const directive = { type: 'directive', selector: 'tip' } as ComponentOrDirectiveMetadata;

/**
 * An imported symbol.
 */
const symbol = (local: string, reactive: boolean) => ({ local, reactive }) as SymbolImport;

/**
 * Reads the usage of a template rendering the child.
 */
const usageOf = (source: string, reactiveMembers: readonly string[] = [], symbols: readonly SymbolImport[] = [], shadowingMembers: readonly string[] = []) => getTemplateUsage(parseTemplate(source), [child, directive], symbols, { reactiveMembers, shadowingMembers });

/**
 * Reads the first component a template renders, without the metadata.
 */
const firstUsage = (source: string, reactiveMembers?: readonly string[]) => {
  const { component: _component, ...usage } = usageOf(source, reactiveMembers).components[0];
  return usage;
};

describe('getTemplateUsage', () => {
  describe('the logic', () => {
    it.each([
      ['elements, texts and blocks', '<p class="a">{ title() }</p>@if (a) { <b></b> } @for (item of items; track item()) { { item() } }'],
      ['a component of the project', '<x-child label="a"></x-child>'],
      ['a member named like a global', '{ status }'],
      ['a variable named like a global', '@let status = 1; { status }'],
      ['an imported name', '{ location }'],
      ['the names of members and keys', '{ user.document } { { window: 1 } }']
    ])('finds none in %s', (_case, source) => {
      expect(usageOf(source, [], [symbol('location', false)], ['status']).logic).toBeUndefined();
    });

    it.each([
      ['a listener', '<p (click)="a()"></p>', 'listens to (click)'],
      ['a directive', '<p @@tip></p>', 'applies the directive tip'],
      ['a structural directive', '<p *later></p>', 'applies the directive later'],
      ['an element ref', '<p #field></p>', 'declares the element ref #field'],
      ['a @hydrate', '@hydrate (idle) { }', 'declares a @hydrate'],
      ['a @client', '@client { }', 'declares a @client'],
      ['a @defer', '@defer (idle) { }', 'declares a @defer'],
      ['a lazy import', '@import lazy { Panel } from \'./panel\';\n<p></p>', 'imports ./panel lazily'],
      ['a custom element outside of the project', '<sl-button></sl-button>', 'renders <sl-button>, which is not a component of the project'],
      ['a signal of a module', '{ count() }', 'reads the signal count of a module'],
      ['a global only the browser has', '{ document.title }', 'reads the global document'],
      ['a global guarded by typeof', '{ typeof document }', 'reads the global document']
    ])('finds %s', (_case, source, logic) => {
      expect(usageOf(source, [], [symbol('count', true)]).logic).toBe(logic);
    });

    it('keeps the first logic it finds', () => {
      expect(usageOf('<p (click)="a()" #field></p>{ document.title }{ window.name }').logic).toBe('declares the element ref #field');
    });
  });

  describe('the components', () => {
    it('finds the components, not the directives or the native elements', () => {
      const { components } = usageOf('<p @@tip></p><x-child></x-child><div><x-child></x-child></div>');

      expect(components).toHaveLength(2);
      expect(components[0].component).toBe(child);
    });

    it('reads the inputs bound to values', () => {
      expect(firstUsage('<x-child label="a" other="{ b() }"></x-child>')).toEqual({ dynamic: false, placeholder: false, reactiveInputs: false, expressionInputs: [] });
    });

    it('lists the inputs bound to expressions', () => {
      expect(firstUsage('<x-child label="{ text }" size="{ 1 }"></x-child>')).toEqual({ dynamic: false, placeholder: false, reactiveInputs: false, expressionInputs: ['label', 'size'] });
    });

    it.each([
      ['a call', '<x-child label="{ text() }"></x-child>'],
      ['a call in an expression', '<x-child label="{ a + format(text) }"></x-child>'],
      ['a reactive member', '<x-child label="{ total }"></x-child>'],
      ['a value in a reactive @if', '<x-child @if (open()) { label="a" }></x-child>'],
      ['a value in the @else of a reactive @if', '<x-child @if (open()) { size="1" } @else { label="a" }></x-child>'],
      ['a value in a reactive @switch', '<x-child @switch (kind()) { @case (1) { label="a" } }></x-child>'],
      ['a value nested in a reactive @if', '<x-child @if (open()) { @if (other) { label="a" } }></x-child>']
    ])('tells an input depends on a signal through %s', (_case, source) => {
      expect(firstUsage(source, ['total']).reactiveInputs).toBe(true);
    });

    it.each([
      ['a member of an object', '<x-child label="{ user.total }"></x-child>'],
      ['a constant @if', '<x-child @if (open) { label="a" }></x-child>'],
      ['a constant @switch', '<x-child @switch (kind) { @case (1) { label="a" } }></x-child>'],
      ['a reactive @if binding no input', '<x-child @if (open()) { other="a" }></x-child>'],
      ['an @else without a condition', '<x-child @if (open) { size="1" } @else { label="a" }></x-child>']
    ])('tells an input is constant through %s', (_case, source) => {
      expect(firstUsage(source, ['total']).reactiveInputs).toBe(false);
    });

    it.each([
      ['a reactive @if', '@if (open()) { <x-child></x-child> }'],
      ['the @else of a reactive @if', '@if (open()) { } @else { <x-child></x-child> }'],
      ['the @else if of a reactive @if', '@if (open()) { } @else if (other) { <x-child></x-child> }'],
      ['a reactive @else if', '@if (open) { } @else if (other()) { <x-child></x-child> }'],
      ['a reactive @for', '@for (item of items(); track item()) { <x-child></x-child> }'],
      ['a reactive @switch', '@switch (kind()) { @case (1) { <x-child></x-child> } }'],
      ['a @default of a reactive @switch', '@switch (kind()) { @default { <x-child></x-child> } }'],
      ['a <template>', '<template row()><x-child></x-child></template>'],
      ['a @client', '@client { <x-child></x-child> }'],
      ['a @try', '@try { <x-child></x-child> } @catch { }'],
      ['a @catch', '@try { } @catch (error) { <x-child></x-child> }'],
      ['a @defer', '@defer (idle) { <x-child></x-child> }'],
      ['the @placeholder of a @defer', '@defer (idle) { } @placeholder { <x-child></x-child> }'],
      ['the @loading of a @defer', '@defer (idle) { } @loading { <x-child></x-child> }'],
      ['the @error of a @defer', '@defer (idle) { } @error { <x-child></x-child> }'],
      ['an element in a reactive @if', '@if (open()) { <div><x-child></x-child></div> }'],
      ['a constant @if in a reactive one', '@if (open()) { @if (other) { <x-child></x-child> } }']
    ])('tells the browser may create a component in %s', (_case, source) => {
      expect(firstUsage(source).dynamic).toBe(true);
    });

    it.each([
      ['a constant @if', '@if (open) { <x-child></x-child> }'],
      ['the @else of a constant @if', '@if (open) { } @else { <x-child></x-child> }'],
      ['a constant @for', '@for (item of items; track item()) { <x-child></x-child> }'],
      ['a constant @switch', '@switch (kind) { @case (1) { <x-child></x-child> } }'],
      ['a @hydrate', '@hydrate (idle) { <x-child></x-child> }']
    ])('tells the server is the only one rendering a component in %s', (_case, source) => {
      expect(firstUsage(source).dynamic).toBe(false);
    });

    it('tells a component is in a @placeholder', () => {
      expect(firstUsage('@client { } @placeholder { <x-child></x-child> }')).toMatchObject({ dynamic: false, placeholder: true });
      expect(firstUsage('@if (open()) { @client { } @placeholder { <div><x-child></x-child></div> } }')).toMatchObject({ dynamic: true, placeholder: true });
    });

    it('finds nothing in the nodes rendering no component', () => {
      expect(usageOf('text { a } @let b = 1; <template row()></template> @render row()').components).toEqual([]);
    });
  });
});
