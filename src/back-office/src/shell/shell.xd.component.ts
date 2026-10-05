import { CustomElement, Query, WebComponent } from '@xaendar/core';
import { QuerySignal, Signal, signal } from '@xaendar/core/signals';

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
>…</span>`,
    ifElseProperty: `<app-binding-preview
  @if (ifElseBound()) {
    value="{ifElseCount().toString()}"
  } @else {
    detail="{ifElseName()}"
  }
/>`,
    chainProperty: `<app-binding-preview
  @if (chainBindingCount() > 5) {
    value="{'alto: ' + chainBindingCount()}"
  } @else if (chainBindingCount() > 0) {
    value="{'basso: ' + chainBindingCount()}"
    detail="{chainBindingName()}"
  } @else {
    detail="nessun valore positivo"
  }
/>`,
    switchProperty: `<app-binding-preview
  @switch (switchBindingStep()) {
    @case (1) {
      value="uno"
    }
    @case (2) @case (3) {
      value="{'due o tre: ' + switchBindingStep()}"
      detail="{switchBindingName()}"
    }
    @default {
      detail="{'nessun caso per ' + switchBindingStep()}"
    }
  }
/>`,
    ifElseStructural: `<span
  @if (ifElseDirectiveStrict()) {
    *allowedUser(name="{ifElseDirectiveName()}")
  } @else {
    *minLength(value="{ifElseDirectiveName()}" min="{3}")
  }
>…</span>`,
    chainStructural: `<span
  @if (chainDirectiveCount() > 5) {
    *allowedUser(name="{chainDirectiveName()}")
  } @else if (chainDirectiveCount() > 0) {
    *isEven(value="{chainDirectiveCount()}")
    *minLength(value="{chainDirectiveName()}" min="{chainDirectiveCount()}")
  } @else {
    *minLength(value="{chainDirectiveName()}" min="{3}")
  }
>…</span>`,
    switchStructural: `<span
  @switch (switchDirectiveMode()) {
    @case ('utente') {
      *allowedUser(name="{switchDirectiveName()}")
    }
    @case ('pari') {
      *isEven(value="{switchDirectiveCount()}")
    }
    @case ('entrambe') {
      *isEven(value="{switchDirectiveCount()}")
      *minLength(value="{switchDirectiveName()}" min="{switchDirectiveCount()}")
    }
    @default {}
  }
>…</span>`,
    complexStructural: `<div
  *minLength(value="{complexName()}" min="{2}")
  @if (complexGuarded()) {
    *allowedUser(name="{complexName()}")
  }
>
  <app-binding-preview
    @switch (complexMode()) {
      @case ('pari') {
        *isEven(value="{complexItems().length}")
        value="{'pari: ' + complexItems().length}"
      }
      @case ('lungo') {
        *minLength(value="{complexName()}" min="{5}")
        value="{'lungo: ' + complexName()}"
        @if (complexDetailed()) {
          detail="{complexName().length + ' caratteri'}"
        }
      }
      @default {
        @if (complexDetailed()) {
          detail="nessuna direttiva"
        } @else {
          value="libero"
        }
      }
    }
  />
  @if (complexItems().length) {
    @for (n of complexItems(); track n) {
      <span
        @if (complexMode() === 'pari') {
          *isEven(value="{n}")
        } @else if (complexMode() === 'lungo') {
          *minLength(value="{complexName()}" min="{n}")
        } @else if (complexDetailed()) {
          *allowedUser(name="{complexName()}")
        }
      >{n}</span>
    }
  } @else {
    <p>Nessun elemento</p>
  }
</div>`
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

  // Binding di proprietà if / else
  public readonly ifElseBound = signal(true);
  public readonly ifElseCount = signal(1);
  public readonly ifElseName = signal('Daniela');

  // Binding di proprietà if / else if / else
  public readonly chainBindingCount = signal(3);
  public readonly chainBindingName = signal('Michele');

  // Binding di proprietà switch
  public readonly switchBindingStep = signal(1);
  public readonly switchBindingName = signal('Federico');

  // Direttiva strutturale if / else
  public readonly ifElseDirectiveStrict = signal(true);
  public readonly ifElseDirectiveName = signal('Silvano');

  // Direttiva strutturale if / else if / else
  public readonly chainDirectiveCount = signal(4);
  public readonly chainDirectiveName = signal('Daniela');

  // Direttiva strutturale switch
  public readonly switchDirectiveMode = signal<'utente' | 'pari' | 'entrambe' | 'nessuna'>('utente');
  public readonly switchDirectiveCount = signal(2);
  public readonly switchDirectiveName = signal('Michele');

  // Direttive strutturali statiche e condizionali annidate
  public readonly complexName = signal('Federico');
  public readonly complexGuarded = signal(false);
  public readonly complexMode = signal<'pari' | 'lungo' | 'libero'>('pari');
  public readonly complexDetailed = signal(true);
  public readonly complexItems = signal([1, 2, 3, 4, 5, 6]);

  @Query('[bindingPreview]')
  public accessor testQuery!: QuerySignal<HTMLElement | null>;

  @Query.all('[bindingPreview]')
  public accessor testQueryAll!: QuerySignal<HTMLElement[]>;

  public afterRender(): void {
    this.effect(() => console.log(this.testQuery()));
    this.effect(() => console.log(this.testQueryAll()));
  }
  
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

  /**
   * Sets a signal to one of its allowed values.
   *
   * @param target - The signal to update.
   * @param value - The value to set.
   */
  public select<T>(target: Signal<T>, value: T): void {
    target.set(value);
  }

  /**
   * Resizes a list of the numbers from 1 to its length.
   *
   * @param target - The signal holding the list.
   * @param step - How many numbers to add, negative to remove them.
   */
  public resize(target: Signal<number[]>, step: number): void {
    target.update(items => Array.from({ length: Math.max(items.length + step, 0) }, (_, i) => i + 1));
  }
}
