import { CustomElement, Event, Output, Property, Query, WebComponent } from '@xaendar/core';
import { InputSignal, QuerySignal, signal } from '@xaendar/core/signals';

type Item<T> = {
  label: string,
  value: T
}

@WebComponent({
  selector: 'ex-switch-button',
  styleUrl: './switch-button.xd.component.css',
  templateUrl: './switch-button.xd.component.html'
})
export class SwitchButtonComponent<T = string> extends CustomElement {
  @Property.required({ transform: items => items.map(item => { item.label = item.label.toUpperCase(); return item }) })
  public accessor items!: InputSignal<Item<T>[]>

  @Event()
  public accessor valueChange!: Output<Item<T>>

  @Query('.selected')
  public accessor selectedCircle!: QuerySignal<HTMLSpanElement | null>

  @Query.all('button.lang')
  public accessor buttons!: QuerySignal<HTMLButtonElement[]>

  public readonly selected = signal<Item<T> | null>(null);

  public afterRender(): void {
    if (!this.selected()) {
      this.updateSelectedOnItemsChange();
    }
  }

  public onButtonClick(item: Item<T>, index: number): void {
    this._selectItem(item, index);
  }

  public updateSelectedOnItemsChange(): void {
    const items = this.items();
    if (items.length) {
      this._selectItem(items[0]);
    }
  }

  private _selectItem(item: Item<T>, index = 0): void {
    this.selected.set(item);
    this.valueChange.emit(item);
    const button = this.buttons()[index];
    this.selectedCircle()!.style.left = `${button.offsetLeft}px`;
    this.selectedCircle()!.style.width = `${button.offsetWidth}px`;
  }
}