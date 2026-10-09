// code-block.xd.component.ts
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
public accessor tags!: InputSignal<string[]>;
