import type { MethodDecorator } from '@xaendar/types';

/**
 * Logs every call of a method, with its arguments.
 */
const Logged: MethodDecorator<object, (...args: any[]) => unknown> = (method, context) => {
  return function (this: unknown, ...args: unknown[]): unknown {
    console.log(`${String(context.name)}(${args.join(', ')})`);
    return method.apply(this, args);
  };
};

/**
 * A shopping cart.
 */
class Cart {
  /**
   * The quantity of each product, by id.
   */
  public readonly quantities = new Map<string, number>();

  /**
   * Adds a product.
   *
   * @param id - The id of the product.
   * @param quantity - How many to add.
   */
  @Logged
  public add(id: string, quantity: number): void {
    this.quantities.set(id, (this.quantities.get(id) ?? 0) + quantity);
  }
}

new Cart().add('apple', 3); // logs add(apple, 3)
