/**
 * A constant of the module.
 */
const LIMIT = 5;

/**
 * A cart with a maximum number of items.
 */
export class CartComponent extends CustomElement {
  /**
   * ✓ The constant, exposed as a member.
   */
  public readonly limit = LIMIT;
}

// <p>{ LIMIT }</p>   ✗ Property 'LIMIT' does not exist on type 'CartComponent'.
// <p>{ limit }</p>   ✓
