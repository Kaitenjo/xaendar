/**
 * The tags of the native elements accepting a shadow root (`attachShadow`): a customized built-in element extending one
 * of them can render a template, while the others throw a `NotSupportedError` on `attachShadow`.
 */
export type ShadowHostTagName = 'article' | 'aside' | 'blockquote' | 'body' | 'div' | 'footer' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'header' | 'main' | 'nav' | 'p' | 'section' | 'span';
