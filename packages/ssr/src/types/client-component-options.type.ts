/**
 * What the code compiled for the server tells `_ssrClientComponent` of a component rendering only in the browser, whose
 * class may not be there.
 */
export type ClientComponentOptions = {
  /**
   * Whether a static template renders the component: no template sets its inputs in the browser.
   */
  readonly island: boolean;
  /**
   * The trigger its `ssr.hydrate` declares, if any.
   */
  readonly hydrate?: string;
};
