import type { CustomDirective } from '../models/custom-directive/custom-directive';
import type { CustomElement } from '../models/custom-element/custom-element';

/**
 * A class whose accessors can be bound from a template through `@Property` and `@Event`:
 * a web component or a directive.
 */
export type BindingHost = CustomElement | CustomDirective;
