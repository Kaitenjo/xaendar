import { CustomElement, Query, WebComponent, query } from '@xaendar/core';
import { signal } from '@xaendar/core/signals';
import type { QuerySignal } from '@xaendar/core/signals';

const w = window as unknown as { __m4: string[] };
w.__m4 ??= [];
const log = (s: string) => w.__m4.push(s);

@WebComponent({ selector: 'lab-ev', templateUrl: './ev.xd.component.html' })
export class LabEv extends CustomElement {
  public readonly items = signal([1, 2]);
  public readonly active = signal(1);
  public readonly styleObj = signal({ color: 'red' });

  @Query.all('li')
  public accessor lis!: QuerySignal<HTMLElement[]>;
  @Query.all('.active')
  public accessor actives!: QuerySignal<HTMLElement[]>;
  @Query('li')
  public accessor firstLi!: QuerySignal<HTMLElement | null>;

  public readonly early = query(this, 'li');
  public late?: QuerySignal<HTMLElement | null>;

  public onInit(): void {
    log(`ev onInit firstLi=${this.firstLi()?.textContent ?? 'null'} connected=${this.firstLi()?.isConnected}`);
  }

  public afterRender(): void {
    log(`ev afterRender firstLi=${this.firstLi()?.textContent} early=${this.early()?.textContent}`);
  }

  public onValue(value: CustomEvent<number>): void {
    log(`valueChange detail=${value.detail} type=${value.constructor.name}`);
  }
  public onPing(): void { log('ping'); }
  public onBubbly(value: CustomEvent<string>): void { log(`bubbly ${value.detail}`); }
  public onPayload(value: CustomEvent<{ bubbles: boolean; value: number }>): void { log(`payload detail=${JSON.stringify(value.detail)} bubbles=${value.bubbles}`); }

  public async add(): Promise<void> {
    this.items.update(list => [...list, list.length + 1]);
    log(`sync lis=${this.lis().length}`);
    await Promise.resolve();
    log(`micro1 lis=${this.lis().length}`);
    await Promise.resolve();
    log(`micro2 lis=${this.lis().length}`);
    await new Promise(r => setTimeout(r));
    log(`macro lis=${this.lis().length}`);
  }

  public async activate(): Promise<void> {
    this.active.set(2);
    await new Promise(r => setTimeout(r, 20));
    log(`actives=${this.actives().map(e => e.textContent).join(',')} real=${[...this.shadowRoot!.querySelectorAll('.active')].map(e => e.textContent).join(',')}`);
  }

  public makeLate(): void {
    this.late = query(this, 'li');
    log(`late=${this.late()?.textContent ?? 'null'}`);
  }

  public readLate(): void {
    log(`late now=${this.late?.()?.textContent ?? 'null'}`);
  }
}
