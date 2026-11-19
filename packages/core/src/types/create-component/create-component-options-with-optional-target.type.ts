import type { CustomDirective } from '../../models/custom-directive/custom-directive';
import type { CustomElement } from '../../models/custom-element/custom-element';
import type { CreateComponentOptions } from './create-component-options.type';

/**
 * The options of `createComponent` of `CustomElement` and of `CustomDirective`, as `CreateComponentOptions` but with `target` optional:
 * when it is missing, the component is appended to the host element, that is the element of the component or the element the
 * directive is applied to.
 *
 * @template Component - The component to create.
 * @template Directives - The custom directives applied to the component, one per item of `directives`.
 */
export type CreateComponentOptionsWithOptionalTarget<
  Component extends CustomDirective | CustomElement,
  Directives extends readonly CustomDirective[] = CustomDirective[]
> = Omit<CreateComponentOptions<Component, Directives>, 'target'> & Partial<Pick<CreateComponentOptions<Component, Directives>, 'target'>>;
