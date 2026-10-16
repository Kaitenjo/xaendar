// limits.ts

/**
 * The maximum number of items in a cart, exported for the templates that show it.
 */
export const LIMIT = 5;

// cart.xd.component.html
// @import { LIMIT } from './limits.ts'
// <p>{ LIMIT }</p>   ✓
//
// Without the @import:
// <p>{ LIMIT }</p>   ✗ Property 'LIMIT' does not exist on type 'CartComponent'.
