/**
 * Options of the queries on the content projected into a component (see `Query.content`).
 * By default the query looks for the elements assigned to the slots of the Shadow DOM, and their descendants:
 * it can be restricted to some slots via `slots`, or extended to the whole light DOM via `lightDom`,
 * but not both.
 */
export type QuerySlotOptions = {
  /**
   * The name of the slot whose assigned elements are queried, or the names of the slots, the empty string for the
   * default slot. When omitted, the elements assigned to any slot are queried.
   */
  slots?: string | string[];
  /**
   * The query is restricted to the elements assigned to the slots.
   */
  lightDom?: false;
} | {
  /**
   * Extends the query to the whole light DOM of the component, including the elements not assigned to any slot.
   */
  lightDom: true;
  /**
   * Not allowed together with `lightDom`.
   */
  slots?: never;
};
