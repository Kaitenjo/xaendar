/**
 * What the analysis of a project found out about its components (see `findStaticComponents`).
 */
export type StaticComponents = {
  /**
   * The modules holding only static components, each with the modules the browser loads in its place: the ones of the
   * components it renders.
   */
  readonly modules: ReadonlyMap<string, readonly string[]>;
  /**
   * The tag names of the interactive components each template of a static component renders, by the path of the template.
   */
  readonly islands: ReadonlyMap<string, ReadonlySet<string>>;
  /**
   * The tag names of the static components.
   */
  readonly statics: readonly string[];
  /**
   * What keeps each interactive component in the bundle of the browser, by its tag name.
   */
  readonly interactive: ReadonlyMap<string, string>;
};
