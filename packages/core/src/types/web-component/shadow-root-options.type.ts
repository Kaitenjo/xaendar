/**
 * The options of the shadow root of a component, the ones `attachShadow` takes but `mode`, always `open`: the framework
 * reads the shadow root of a component, for its queries and its hydration, through `shadowRoot`, which a `closed` one
 * leaves `null`. The server writes them on the declarative shadow root of the component, so the root the browser parses
 * has them before the component hydrates.
 */
export type ShadowRootOptions = Pick<ShadowRootInit, 'clonable' | 'delegatesFocus' | 'serializable' | 'slotAssignment'>;
