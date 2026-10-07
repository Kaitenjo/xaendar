import { CustomElement, Event, Property } from '@xaendar/core';
import type { Output } from '@xaendar/core';
import { computed, signal } from '@xaendar/core/signals';
import type { InputSignal } from '@xaendar/core/signals';

export abstract class LabBase extends CustomElement {
  @Property(0)
  public accessor start!: InputSignal<number>;
  @Event()
  public accessor changed!: Output<number>;
  public readonly value = signal(0);
  public readonly doubled = computed(() => this.value() * 2);
  public inc(): void { this.value.update(v => v + 1); this.changed.emit(this.value()); }
}
