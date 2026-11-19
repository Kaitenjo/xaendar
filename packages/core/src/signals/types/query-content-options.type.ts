/**
 * Options of the queries on the content passed to a component (see `Query.content`), as `contentChild` and
 * `contentChildren` of Angular: the query looks into the light DOM of the component, whether its Shadow DOM renders
 * the content or not. The `slot` attribute is an attribute like any other: a selector can match it
 * (`[slot="footer"]`), and it restricts nothing by itself.
 */
export type QueryContentOptions = {
  /**
   * Whether the descendants of the children of the component are queried too, or only its children. By default `true`
   * for `Query.content` and `Query.contentRequired`, `false` for `Query.contentAll`, as in Angular.
   */
  descendants?: boolean;
};
