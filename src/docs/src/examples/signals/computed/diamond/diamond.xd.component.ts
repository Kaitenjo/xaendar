import { CustomElement, WebComponent } from '@xaendar/core';
import { computed, signal } from '@xaendar/core/signals';

/**
 * A diamond: two computed signals depend on the same source, a third one on both.
 * The last one is evaluated once per change, and never sees an inconsistent pair.
 */
@WebComponent({
  selector: 'ex-computed-diamond',
  templateUrl: './diamond.xd.component.html',
  styleUrl: './diamond.css'
})
export class ComputedDiamondComponent extends CustomElement {
  /**
   * The source.
   */
  public readonly price = signal(100);
  /**
   * Left branch.
   */
  public readonly tax = computed(() => this._computeTax());
  /**
   * Right branch.
   */
  public readonly shipping = computed(() => this._computeShipping());
  /**
   * Depends on both branches.
   */
  public readonly total = computed(() => this._computeTotal());
  /**
   * The evaluations of `total`, most recent first.
   */
  public readonly evaluations = signal<string[]>([]);
  /**
   * Every evaluation of `total`, with the values it saw. Plain field, published by `snapshot`.
   */
  private _seen: string[] = [];

  /**
   * Publishes the evaluations of `total` once the template has updated.
   */
  public onInit(): void {
    this.effect(() => {
      this.total();
      queueMicrotask(() => this.evaluations.set([...this._seen].reverse().slice(0, 5)));
    });
  }

  /**
   * Changes the source once.
   */
  public raise(): void {
    this.price.update(price => price + 25);
  }

  /**
   * Computes the value of `tax`.
   *
   * @returns The tax on the price.
   */
  private _computeTax(): number {
    return this.price() * 0.22;
  }

  /**
   * Computes the value of `shipping`.
   *
   * @returns The shipping cost, free above 150.
   */
  private _computeShipping(): number {
    return this.price() > 150 ? 0 : 10;
  }

  /**
   * Computes the value of `total`.
   *
   * @returns The price plus tax and shipping.
   */
  private _computeTotal(): number {
    const total = this.price() + this.tax() + this.shipping();
    this._seen.push(`price ${this.price()} + tax ${this.tax()} + shipping ${this.shipping()} = ${total}`);
    return total;
  }
}
