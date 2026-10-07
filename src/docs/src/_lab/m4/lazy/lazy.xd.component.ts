import { CustomElement, WebComponent } from '@xaendar/core';
import { signal } from '@xaendar/core/signals';

@WebComponent({ selector: 'lab-lazy', templateUrl: './lazy.xd.component.html', styleUrl: './shared.css' })
export class LabLazy extends CustomElement {
  public readonly n = signal(1);
  public inc(): void { this.n.update(v => v + 1); }
  public async load(): Promise<void> { await import('./orphan-lazy.xd.component.ts'); }
}
@WebComponent({ selector: 'lab-lazy-twin', templateUrl: './lazy.xd.component.html', styleUrl: './shared.css' })
export class LabLazyTwin extends LabLazy {}
