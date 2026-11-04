import type { Dictionary } from '@xaendar/types';

/**
 * What the code compiled for the server tells `_ssrClientComponent` of a component rendering only in the browser, whose
 * class may not be there.
 */
export type ClientComponentOptions = {
  /**
   * The name of the property of each input, by the name it is bound with.
   */
  readonly inputs: Dictionary<string, string>;
  /**
   * Whether a static template renders the component: no template sets its inputs in the browser.
   */
  readonly island: boolean;
  /**
   * The trigger its `ssr.hydrate` declares, if any.
   */
  readonly hydrate?: string;
};
