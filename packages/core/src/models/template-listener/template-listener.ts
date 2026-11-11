import type { RenderElementEvent } from '../../types/render-element-event.type';
import type { _Context } from '../../utils/context/context.util';

/**
 * A listener of an element rendered by a template (`(click)="select(row.id)"`): the object the element listens with,
 * calling the handler of the template with the component as `this`, the context of the scope declaring the listener and
 * the event, and removing itself when the context is cleared.
 *
 * N.B. Deliberate, to save memory: one object per listener, whose methods live on the prototype, registered both with
 * `addEventListener`, as an object handling the events (`handleEvent`), and in the context, as a cleanup disposed with
 * `dispose()`, instead of an arrow calling the handler plus one removing it, closures created for every listener of
 * every element. Do not turn it back into functions.
 */
export class TemplateListener {
  /**
   * Creates the listener, which the element is then given (`addEventListener(event.name, listener)`).
   *
   * @param _element - The element listened to.
   * @param _event - The descriptor of the listener, a constant of the module of the template.
   * @param _context - The context of the scope declaring the listener, which the handler reads the variables from.
   */
  constructor(
    private readonly _element: Element,
    private readonly _event: RenderElementEvent,
    private readonly _context: _Context
  ) { }

  /**
   * Handles an event, calling the handler of the template.
   *
   * @param event - The event.
   */
  public handleEvent(event: Event): void {
    const context = this._context;
    this._event.handler.call(context.component, context, event);
  }

  /**
   * Removes the listener from the element, when its context is cleared.
   */
  public dispose(): void {
    this._element.removeEventListener(this._event.name, this);
  }
}
