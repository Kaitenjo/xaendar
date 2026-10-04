import { CustomElement, WebComponent } from '@xaendar/core';
import { Signal, signal } from '@xaendar/core/signals';

/**
 * Application shell: sidebar, topbar and a playground of template binding examples.
 */
@WebComponent({
  selector: 'app-shell',
  styleUrl: './shell.component.css',
  templateUrl: './shell.xd.component.html',
})
export class ShellComponent extends CustomElement {
  public readonly snippets = {
    conditionalProperty: `<app-binding-preview
  @if (conditionalBound()) {
    value="{conditionalCount().toString()}"
  }
/>`,
    nestedProperty: `<app-binding-preview
  @if (nestedOuterBound()) {
    value="{nestedCount().toString()}"
    @if (nestedInnerBound()) {
      detail="{nestedName()}"
    }
  }
/>`,
    structural: `<span *allowedUser(name="{structuralName()}")>
  Ciao {structuralName()}
</span>`,
    multipleStructural: `<span
  *isEven(value="{multipleCount()}")
  *minLength(value="{multipleName()}" min="{3}")
>…</span>`,
    conditionalStructural: `<span
  @if (conditionalDirectiveApplied()) {
    *allowedUser(name="{conditionalDirectiveName()}")
  }
>…</span>`,
    mixedStructural: `<span
  *isEven(value="{mixedCount()}")
  *minLength(value="{mixedName()}" min="{3}")
  @if (mixedDirectiveApplied()) {
    *allowedUser(name="{mixedName()}")
  }
>…</span>`
  };

  public readonly sidebarCollapsed = signal(false);

  // Binding di proprietà condizionale
  public readonly conditionalBound = signal(true);
  public readonly conditionalCount = signal(1);

  // Binding di proprietà dinamico innestato
  public readonly nestedOuterBound = signal(true);
  public readonly nestedInnerBound = signal(true);
  public readonly nestedCount = signal(1);
  public readonly nestedName = signal('Dario');

  // Direttiva strutturale
  public readonly structuralName = signal('Dario');

  // Più direttive strutturali assieme
  public readonly multipleCount = signal(2);
  public readonly multipleName = signal('Dario');

  // Direttiva strutturale condizionale
  public readonly conditionalDirectiveApplied = signal(true);
  public readonly conditionalDirectiveName = signal('Dario');

  // Direttive strutturali, 2 statiche e una condizionale
  public readonly mixedCount = signal(2);
  public readonly mixedName = signal('Dario');
  public readonly mixedDirectiveApplied = signal(true);

  /**
   * Collapses or expands the sidebar.
   */
  public onSidebarToggle(): void {
    this.sidebarCollapsed.update(value => !value);
  }

  /**
   * Keeps the shell in sync with the sidebar collapsing itself.
   *
   * @param event - The event carrying the new collapsed state.
   */
  public onCollapseChange(event: CustomEvent<boolean>): void {
    this.sidebarCollapsed.set(event.detail);
  }

  /**
   * Negates a boolean signal.
   *
   * @param target - The signal to negate.
   */
  public toggle(target: Signal<boolean>): void {
    target.update(value => !value);
  }

  /**
   * Adds a step to a numeric signal.
   *
   * @param target - The signal to update.
   * @param step - The amount to add, negative to subtract.
   */
  public increment(target: Signal<number>, step: number): void {
    target.update(value => value + step);
  }

  /**
   * Sets a string signal to the value typed in an input.
   *
   * @param target - The signal to update.
   * @param event - The input event.
   */
  public setText(target: Signal<string>, event: Event): void {
    target.set((event.target as HTMLInputElement).value);
  }
}
