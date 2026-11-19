/**
 * The listener of an event a host directive exposes on a component created by `createComponent`: its type is not known,
 * so it takes an `Event`, which a listener can narrow by annotating its parameter
 * (`tipShown: (event: CustomEvent<string>) => …`).
 *
 * Declared through a method, whose parameters are bivariant: as the type of every name the class does not declare (see
 * `ExposableBindings`) it is also compared with the listeners of the native events and of the outputs, which take a
 * narrower event and would be rejected by a function type.
 */
export type ExposedEventListener = {
  /**
   * Receives the event dispatched on the component.
   *
   * @param event - The event.
   * @returns Anything: the value is ignored.
   */
  listener(event: Event): unknown
}['listener'];
