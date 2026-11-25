/**
 * What the runtime checks in the value an expression binds to an attribute holding URLs (see `getUrlCheck`): `'url'` a
 * URL running code, `'resource'` also the origin of the resource the attribute loads into the page. Both generators
 * write it in the descriptor of the attribute (`url: true`, `resource: true`), or as the arguments of `_checkUrl` around
 * the value they write; whether and how the runtime checks it is the `security` of the project, never of the template.
 */
export type AttributeUrlCheck = 'url' | 'resource';
