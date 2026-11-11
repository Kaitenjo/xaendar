import type { _Context } from '../utils/context/context.util';

/**
 * An expression of a template, compiled into a function of the module of the template: the runtime calls it with the
 * component as `this`, which it reads the members of, and the context of the scope it is in, which it reads the
 * variables of the template from (`context.get('row')`).
 *
 * N.B. Deliberate, to save memory: a function declared once in the module, receiving what it reads, instead of an arrow
 * function created for every instance of the template, capturing the context and the component. Do not turn it back into
 * a closure.
 *
 * @template Value - The type of the value of the expression.
 */
export type TemplateExpression<Value> = (this: unknown, context: _Context) => Value;
