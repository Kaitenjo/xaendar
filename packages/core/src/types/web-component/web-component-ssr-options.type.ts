import type { HydrateTrigger } from '../hydrate-trigger.type';

/**
 * How a component behaves when the page is rendered on the server.
 */
export type WebComponentSsrOptions = {
  /**
   * `false` keeps the component in the bundle of the browser, where the build would find it static and leave it as the
   * HTML of the server, for what the analysis of the build cannot see: a script calling its methods, or `:defined` in a
   * stylesheet. A component can only be excluded by the build, so `true` is not a value.
   */
  static?: false
} & ({
  /**
   * When an element of the component rendered on the server hydrates, unless a `@hydrate` holding it decides: `load` as
   * soon as it can, the default, `idle` when the browser is idle, `visible` when it enters the viewport, `interaction` at
   * the first event on it, `hover` when the pointer moves over it or the focus enters it. Until then it shows the HTML of
   * the server, and the events on it are recorded, replayed once it is hydrated. With `never` it stays the HTML of the
   * server for good: no event is recorded, and the code of the component stays in the bundle, for the instances a
   * `@hydrate` hydrates and the ones the browser creates. A `@hydrate` holding an element always decides in place of this
   * option, which is for every instance. A component rendered in the browser renders at once. Declaring it keeps the
   * component in the bundle of the browser.
   */
  hydrate?: HydrateTrigger,
  /**
   * The server renders the component: the default.
   */
  render?: undefined
} | {
  /**
   * When the browser renders the component, as for a component rendered on the server. `never` is not a value: the element
   * would stay empty.
   */
  hydrate?: Exclude<HydrateTrigger, 'never'>,
  /**
   * `false` renders the component only in the browser, as a `@client` block holding each one of its elements does: the
   * server writes its element, empty and without running any code of the component, and does not evaluate its module for
   * the templates rendering it, so a library reading `window` when it is imported does not stop the page. It keeps the
   * component in the bundle of the browser.
   */
  render: false
});
