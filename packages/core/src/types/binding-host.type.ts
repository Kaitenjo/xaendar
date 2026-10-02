import type { CustomDirective } from '../models/custom-directive/custom-directive';
import type { CustomElement } from '../models/custom-element/custom-element';
import type { StructuralDirective } from '../models/structural-directive/structural-directive';

/**
 * A class whose accessors can be bound from a template through `@Property`:
 * a web component, a custom directive or a structural directive.
 */
export type BindingHost = CustomElement | CustomDirective | StructuralDirective;
