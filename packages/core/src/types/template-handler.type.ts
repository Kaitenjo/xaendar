import type { _Context } from '../utils/context/context.util';

/**
 * An event handler of a template, compiled into a function of the module of the template: the runtime calls it with the
 * component as `this`, the context of the scope the listener is declared in and the event, which the handler reads as
 * `$event`. It makes the whole call of the template, e.g. `this.select(context.get('row').id, $event)`.
 */
export type TemplateHandler = (this: unknown, context: _Context, $event: Event) => unknown;
