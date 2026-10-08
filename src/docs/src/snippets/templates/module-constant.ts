const LIMIT = 5;                         // a constant of the module

export class CartComponent extends CustomElement {
  public readonly limit = LIMIT;         // ✓ exposed as a member
}

// <p>{ LIMIT }</p>   ✗ Property 'LIMIT' does not exist on type 'CartComponent'.
// <p>{ limit }</p>   ✓
