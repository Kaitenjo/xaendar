import { CustomElement, WebComponent } from '@xaendar/core';
import { signal } from '@xaendar/core/signals';
import { LabSubA } from './sub-a.xd.component';

const w = window as unknown as { __m4: string[] };
w.__m4 ??= [];

@WebComponent({ selector: 'lab-inh', templateUrl: './inh.xd.component.html' })
export class LabInh extends CustomElement {
  public readonly n = signal(10);
  public onChanged(e: CustomEvent<number>): void { w.__m4.push(`changed ${e.detail}`); }
  public tryManual(): void {
    try {
      customElements.define('lab-manual-sub', class extends LabSubA {});
      document.body.append(document.createElement('lab-manual-sub'));
    } catch (e) { w.__m4.push('caught ' + (e as Error).message); }
  }
}
