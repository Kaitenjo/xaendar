import { CustomElement, WebComponent } from '@xaendar/core';
import { signal } from '@xaendar/core/signals';

/**
 * The address of a user, with the city it is in.
 */
type Address = {
  /**
   * The street and the number.
   */
  readonly street: string;
  /**
   * The postal code.
   */
  readonly zip: string;
  /**
   * The city.
   */
  readonly city: string;
};

/**
 * A user and the address their orders are shipped to.
 */
type User = {
  /**
   * The name of the user.
   */
  readonly name: string;
  /**
   * The shipping address.
   */
  readonly address: Address;
};

/**
 * Names the address of a signal holding a user with `@let`, instead of reading `user().address` at every field.
 */
@WebComponent({
  selector: 'ex-shipping-address',
  styleUrl: './shipping-address.css',
  templateUrl: './shipping-address.xd.component.html'
})
export class ShippingAddressComponent extends CustomElement {
  /**
   * The settings of the shop, which never change.
   */
  public readonly defaults = { country: 'Italy' };
  /**
   * The user, with the address their orders are shipped to.
   */
  public readonly user = signal<User>({ name: 'Ada', address: { street: 'Via Roma 1', zip: '20121', city: 'Milano' } });

  /**
   * Moves the user to another address.
   */
  public move(): void {
    this.user.update(user => ({ ...user, address: { street: 'Via Po 7', zip: '10124', city: 'Torino' } }));
  }
}
