import { CustomElement, Event, Output, Property, WebComponent } from '@xaendar/core';
import { InputSignal, signal } from '@xaendar/core/signals';

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
  @Property.required()
  public accessor items!: InputSignal<Item<T>[]>

  @Event()
  public accessor valueChange!: Output<Item<T>>

  public selected = signal<Item<T> | null>(null);

  public onInit(): void {
    if (!this.selected()) {
      this.updateSelectedOnItemsChange();
    }
    
    this.effect(() => this.updateSelectedOnItemsChange());
  }
  
  public onButtonClick(item: Item<T>): void {
    this.selected.set(item)
  }

  public updateSelectedOnItemsChange(): void {
    const items = this.items();
    if (items.length) {
      this.selected.set(items[0]);
    }
  }
}