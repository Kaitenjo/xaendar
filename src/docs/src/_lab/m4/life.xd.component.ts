import { CustomElement, Query, WebComponent } from '@xaendar/core';
import { signal } from '@xaendar/core/signals';
import type { QuerySignal } from '@xaendar/core/signals';

@WebComponent({ selector: 'lab-life', templateUrl: './life.xd.component.html' })
export class LabLife extends CustomElement {
  public readonly n = signal(1);
  public readonly who = signal('ada');
  public readonly bound = signal(true);
  public readonly tagsA = signal(['a', 'b']);
  public readonly show = signal(true);

  @Query('#a')
  public accessor a!: QuerySignal<HTMLElement | null>;
  @Query('#b')
  public accessor b!: QuerySignal<HTMLElement | null>;
  @Query('#c1')
  public accessor c1!: QuerySignal<HTMLElement | null>;

  public onInit(): void {
    (window as unknown as { __m4: string[] }).__m4.push(`parent onInit query=${String(this.c1())}`);
  }

  public afterRender(): void {
    (window as unknown as { __m4: string[] }).__m4.push(`parent afterRender query=${this.c1()?.id}`);
  }

  public inc(): void { this.n.update(v => v + 1); }
  public rename(): void { this.who.set('grace'); }
  public toggleBound(): void { this.bound.update(v => !v); }
  public sameTags(): void { this.tagsA.set(['a', 'b']); }
  public otherTags(): void { this.tagsA.set(['c']); }
  public toggleShow(): void { this.show.update(v => !v); }
  public move(): void {
    const child = this.c1()!;
    (child.parentElement === this.a() ? this.b() : this.a())!.append(child);
  }
  public setAttr(): void { this.c1()!.setAttribute('count', '99'); }
}
