import type { SourceFile } from '../../../core/sources/source-files.utils';

/**
 * The snippet `property-options.ts`, shown by the page components/inputs and the API reference of core-signals and the API reference of core.
 */
export const PROPERTY_OPTIONS: SourceFile = {
  name: 'property-options.ts',
  lang: 'ts',
  code: `/**
 * An input whose default value is 0.
 */
@Property(0)
public accessor count!: InputSignal<number>;
/**
 * Bound as show-value="…" in templates.
 */
@Property(true, { alias: 'show-value' })
public accessor showValue!: InputSignal<boolean>;
/**
 * Normalized and compared through the options of the input.
 */
@Property<InputSignal<string[]>>([], {
  transform: (tags: string[]) => tags.map(tag => tag.trim()),                // applied to every incoming value
  equals: (left: string[], right: string[]) => left.join() === right.join(), // an equal value notifies nobody
  watched: () => console.log('first reader'),                                // the options of a signal: see Signal options
  unwatched: () => console.log('no readers left')
})
public accessor tags!: InputSignal<string[]>;
/**
 * Every template using the component must bind it.
 */
@Property.required()
public accessor name!: InputSignal<string>;`
};

/**
 * The snippet `property-type.ts`, shown by the page components/inputs and the API reference of core-signals and the API reference of core.
 */
export const PROPERTY_TYPE: SourceFile = {
  name: 'property-type.ts',
  lang: 'ts',
  code: `// code-block.xd.component.ts
import type { CodeLang } from './highlight';

/**
 * ✗ The default makes TypeScript infer string, which is not the type of the accessor.
 */
@Property('ts')
public accessor lang!: InputSignal<CodeLang>;
// Unable to resolve signature of property decorator when called as an expression.

/**
 * ✓ The type of the signal is passed to the decorator too.
 */
@Property<InputSignal<CodeLang>>('ts')
public accessor lang!: InputSignal<CodeLang>;
/**
 * ✓ The same for an empty array, or for null.
 */
@Property<InputSignal<string[]>>([])
public accessor tags!: InputSignal<string[]>;`
};

/**
 * The snippet `read-only-input.ts`, shown by the page components/inputs and the API reference of core-signals and the API reference of core.
 */
export const READ_ONLY_INPUT: SourceFile = {
  name: 'read-only-input.ts',
  lang: 'ts',
  code: `/**
 * Tries to reset an input from inside the component.
 */
public reset(): void {
  this.count.set(0);
  // ✗ Property 'set' does not exist on type 'InputSignal<number>'.
  // Forced with a cast, the call throws: Invalid symbol for InputSignal set method
}`
};

/**
 * The snippet `transform-type.ts`, shown by the page components/inputs and the API reference of core-signals and the API reference of core.
 */
export const TRANSFORM_TYPE: SourceFile = {
  name: 'transform-type.ts',
  lang: 'ts',
  code: `/**
 * A number, converted by transform from the string it receives.
 */
@Property(0, { transform: (value: string) => Number(value) })
public accessor size!: InputSignal<number>;

// In a template: size="21"
// ✗ Type 'string' does not satisfy the expected type 'number'.
// The template is checked against InputSignal<number>: the type accepted by transform is not considered.`
};
