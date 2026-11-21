import { CustomElement, Event, Output, Property, Query, WebComponent } from '@xaendar/core';
import { InputSignal, QuerySignal, signal, untracked } from '@xaendar/core/signals';

type Item<T> = {
  label: string,
  value: T
}

/**
 * A row of buttons, one per item, with an indicator sliding under the selected one: the switch of the language of the
 * top bar.
 */
@WebComponent({
  selector: 'ex-switch-button',
  styleUrl: './switch-button.xd.component.css',
  templateUrl: './switch-button.xd.component.html'
})
export class SwitchButtonComponent<T = string> extends CustomElement {
  /**
   * The items, one button each, their labels in upper case.
   */
  @Property.required({ transform: items => items.map(item => { item.label = item.label.toUpperCase(); return item }) })
  public accessor items!: InputSignal<Item<T>[]>

  /**
   * The value of the item shown selected, which the switch follows without emitting `valueChange`: the parent giving it
   * already knows it. Without it, the first item is selected.
   */
  @Property<InputSignal<T | undefined>>(undefined)
  public accessor value!: InputSignal<T | undefined>

  /**
   * Emits the item the user selects with a click, never the one the switch shows on its own.
   */
  @Event()
  public accessor valueChange!: Output<Item<T>>

  /**
   * The indicator sliding under the selected button.
   */
  @Query('.selected')
  public accessor selectedCircle!: QuerySignal<HTMLSpanElement | null>

  /**
   * The buttons of the items.
   */
  @Query.all('button.lang')
  public accessor buttons!: QuerySignal<HTMLButtonElement[]>

  /**
   * The item selected, `null` before the first render or without items.
   */
  public readonly selected = signal<Item<T> | null>(null);

  /**
   * Shows the item of the value selected once the buttons exist, then follows the value.
   */
  public afterRender(): void {
    this.effect(() => {
      const value = this.value();
      untracked(() => this._showValue(value));
    });
  }

  /**
   * Selects the item of the button clicked, and emits it.
   *
   * @param item - The item.
   * @param button - Its button.
   */
  public onButtonClick(item: Item<T>, button: HTMLElement): void {
    this._show(item, button);
    this.valueChange.dispatch(item);
  }

  /**
   * Shows selected the item of a value, without emitting it: without a value, the item already selected, or the first.
   * A value no item has changes nothing.
   *
   * @param value - The value.
   */
  private _showValue(value: T | undefined): void {
    const items = this.items();
    const index = value === undefined ? Math.max(items.indexOf(this.selected()!), 0) : items.findIndex(item => item.value === value);
    if (index !== -1 && index < items.length) {
      this._show(items[index], this.buttons()[index]);
    }
  }

  /**
   * Selects an item and slides the indicator under its button.
   *
   * @param item - The item.
   * @param button - Its button.
   */
  private _show(item: Item<T>, button: HTMLElement): void {
    this.selected.set(item);
    this.selectedCircle()!.style.left = `${button.offsetLeft}px`;
    this.selectedCircle()!.style.width = `${button.offsetWidth}px`;
  }
}
