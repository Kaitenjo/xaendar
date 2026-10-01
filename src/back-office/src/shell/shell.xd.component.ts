import { CustomElement, WebComponent } from '@xaendar/core';
import { signal } from '@xaendar/core/signals';


@WebComponent({
  selector: 'app-shell',
  styleUrl: './shell.component.css',
  templateUrl: './shell.xd.component.html',
})
export class ShellComponent extends CustomElement {
  public readonly sidebarCollapsed = signal(false);

  public onSidebarToggle(): void {
    this.sidebarCollapsed.update(value => !value);
  }

  public onCollapseChange(event: CustomEvent<boolean>): void {
    this.sidebarCollapsed.set(event.detail);
  }

  public readonly enableDrag = signal(true);

  public readonly applyDinamicBinding = signal(true);

  public readonly counter = signal(1);

  public readonly applyDinamicBinding2 = signal(true);

  public readonly counter2 = signal(1);

  public onApplyDinamicBindingToggle(): void {
    this.applyDinamicBinding.update(value => !value);
  }

  public onTextToggle(): void {
    this.counter.update(value => value + 1);
  }

  public onApplyDinamicBindingToggle2(): void {
    this.applyDinamicBinding2.update(value => !value);
  }

  public onTextToggle2(): void {
    this.counter2.update(value => value + 1);
  }

  public onDragToggle(): void {
    this.enableDrag.update(value => !value);
  }
}
