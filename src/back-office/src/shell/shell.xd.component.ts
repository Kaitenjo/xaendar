import { BaseWebComponent, WebComponent } from '@xaendar/core';
import { signal } from '@xaendar/core/signals';


@WebComponent({
  selector: 'app-shell',
  styleUrl: './shell.component.css',
  templateUrl: './shell.xd.component.html',
})
export class ShellComponent extends BaseWebComponent {
  public readonly sidebarCollapsed = signal(false);

  public onSidebarToggle(): void {
    this.sidebarCollapsed.update(value => !value);
  }

  public onCollapseChange(event: CustomEvent<boolean>): void {
    this.sidebarCollapsed.set(event.detail);
  }

  public readonly applyDinamicBinding = signal(true);

  public readonly text = signal('Override 1');

  public onApplyDinamicBindingToggle(): void {
    this.applyDinamicBinding.update(value => !value);
  }

  public onTextToggle(): void {
    this.text.update(value => value === 'Override 1' ? 'Override 2' : 'Override 1');
  }
}

@WebComponent({
  selector: 'app-shell2',
  styleUrl: './shell.component.css',
  templateUrl: './shell.xd.component.html',
})
export class Shell2Component extends BaseWebComponent {
  public readonly sidebarCollapsed = signal(false);

  public onSidebarToggle(): void {
    this.sidebarCollapsed.update(value => !value);
  }

  public onCollapseChange(event: CustomEvent<boolean>): void {
    this.sidebarCollapsed.set(event.detail);
  }

  public readonly applyDinamicBinding = signal(true);

  public readonly text = signal('Override 1');

  public onApplyDinamicBindingToggle(): void {
    this.applyDinamicBinding.update(value => !value);
  }

  public onTextToggle(): void {
    this.text.update(value => value === 'Override 1' ? 'Override 2' : 'Override 1');
  }
}
