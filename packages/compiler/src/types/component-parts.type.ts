/**
 * The parts a component exposes to `::part()`, as its template declares them (see `collectTemplateParts`): the ones
 * the pages and the components rendering it style, and forward with `exportparts`.
 */
export type ComponentParts = {
  /**
   * The names of the parts, each once, in the order the template declares them: the ones of a static `part`, the ones
   * toggled by `part.name`, and the ones a static `exportparts` forwards, by the name it gives them.
   */
  readonly names: readonly string[];
  /**
   * Set when the template may expose parts the compiler cannot read: a `part` or an `exportparts` computed by an
   * expression, or a template given to the component and rendered by `@render`, whose parts are the ones of the code
   * giving it. The names are then the known ones only.
   */
  readonly open?: true;
};
