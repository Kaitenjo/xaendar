import { CustomElement, Property, WebComponent } from '@xaendar/core';
import { effect, signal } from '@xaendar/core/signals';
import type { InputSignal } from '@xaendar/core/signals';

export const calls: string[] = [];
export const src = signal(0, { watched: () => { calls.push('watched'); }, unwatched: () => { calls.push('unwatched'); } });
export const outer = signal(0);

@WebComponent({ selector: 'lab-e-child', templateUrl: './e-child.xd.component.html' })
export class LabEChild extends CustomElement {
  @Property('') public accessor where!: InputSignal<string>;
  public onInit(): void {
    calls.push(`onInit ${this.where()} current=${Signal.subtle.currentComputed() ? 'SET' : 'null'}`);
    outer();
  }
}

@WebComponent({ selector: 'lab-e', templateUrl: './e.xd.component.html' })
export class LabE extends CustomElement {
  public readonly show = signal(false);
  public readonly items = signal([1]);
  public renders = 0;
  public runEffect(): void {
    effect(() => { src(); });
  }
}
Object.assign(window, { __labE: { calls, src, outer } });
