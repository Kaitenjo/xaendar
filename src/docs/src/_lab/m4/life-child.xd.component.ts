import { CustomElement, Property, WebComponent } from '@xaendar/core';
import { signal } from '@xaendar/core/signals';
import type { InputSignal } from '@xaendar/core/signals';

const w = window as unknown as { __m4: string[] };
w.__m4 ??= [];
const log = (s: string) => w.__m4.push(s);

@WebComponent({ selector: 'lab-life-child', templateUrl: './life-child.xd.component.html' })
export class LabLifeChild extends CustomElement {
  @Property(0)
  public accessor count!: InputSignal<number>;
  @Property('none', { alias: 'label-text' })
  public accessor label!: InputSignal<string>;
  @Property(1, { transform: (v: number) => v * 2 })
  public accessor size!: InputSignal<number>;
  @Property.required()
  public accessor name!: InputSignal<string>;
  @Property([] as string[], { equals: (a: string[], b: string[]) => a.join() === b.join() })
  public accessor tags!: InputSignal<string[]>;

  public readonly local = signal(0);
  private readonly ctor = this.effect(() => log(`${this.id} ctor-effect count=${this.count()}`));

  public onInit(): void {
    log(`${this.id} onInit count=${this.count()} name=${this.name()} label=${this.label()} size=${this.size()} shadow=${this.shadowRoot!.childNodes.length} cc=${Signal.subtle.currentComputed() ? 'yes' : 'no'}`);
    this.effect(() => log(`${this.id} init-effect count=${this.count()}`));
    this.effect(() => log(`${this.id} tags-effect ${this.tags().join('|')}`));
  }

  public afterRender(): void {
    log(`${this.id} afterRender count=${this.count()} name=${this.name()} shadow=${this.shadowRoot!.childNodes.length}`);
  }

  public onDestroy(): void {
    log(`${this.id} onDestroy`);
  }

  public bump(): void {
    this.local.update(v => v + 1);
  }
}
