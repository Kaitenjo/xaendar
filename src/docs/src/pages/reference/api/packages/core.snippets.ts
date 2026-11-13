import type { SourceFile } from '../../../../core/sources/source-files.utils';

/**
 * The snippet `cancelable-event.ts`, shown by the API reference of core.
 */
export const CANCELABLE_EVENT: SourceFile = {
  name: 'cancelable-event.ts',
  lang: 'ts',
  code: `/**
 * Declared with @Event, so that templates can listen to it: (closing)="confirmClose($event)".
 */
@Event({ cancelable: true })
public accessor closing!: Output;
/**
 * Whether the dialog is open.
 */
public readonly open = signal(true);

/**
 * Closes the dialog, unless a listener cancels the closing.
 */
public close(): void {
  // emit() returns nothing: dispatchEvent() tells whether a listener called preventDefault()
  const allowed = this.dispatchEvent(new CustomEvent('closing', { cancelable: true }));
  if (allowed) {
    this.open.set(false);
  }
}`
};

/**
 * The snippet `create-component-directives.ts`, shown by the page components/dynamic-creation and the API reference of core.
 */
export const CREATE_COMPONENT_DIRECTIVES: SourceFile = {
  name: 'create-component-directives.ts',
  lang: 'ts',
  code: `this.createComponent(BadgeComponent, {
  target: this.list,
  directives: [
    // Applied as long as the component lives
    TooltipDirective,
    // Applied while the condition holds, a new instance each time it holds again
    {
      directive: HighlightDirective,
      condition: () => this.highlighted(),
      properties: [{ color: () => this.color() }],
      events: [{ toggled: event => this.onToggled(event.detail) }]
    }
  ]
});`
};

/**
 * The snippet `create-component-groups.ts`, shown by the page components/dynamic-creation and the API reference of core.
 */
export const CREATE_COMPONENT_GROUPS: SourceFile = {
  name: 'create-component-groups.ts',
  lang: 'ts',
  code: `this.createComponent(BadgeComponent, {
  target: this.list,
  properties: [
    // Bound as long as the component lives
    { label: () => this.label() },
    // Bound only while the condition holds: then count goes back to its default value
    { condition: () => this.showCount(), count: () => this.count() }
  ],
  events: [
    // An output of the component, with its detail typed
    { selected: event => this.select(event.detail) },
    // A native event, listened to only while the condition holds
    { condition: () => this.editable(), dblclick: () => this.edit() }
  ]
});`
};

/**
 * The snippet `custom-directive.ts`, shown by the API reference of core.
 */
export const CUSTOM_DIRECTIVE: SourceFile = {
  name: 'custom-directive.ts',
  lang: 'ts',
  code: `// copy.directive.ts
/**
 * Copies a text to the clipboard when the element is clicked.
 */
@Directive({ selector: 'exCopy' })
export class CopyDirective extends CustomDirective<HTMLButtonElement> {
  /**
   * The text to copy.
   */
  @Property.required()
  public accessor text!: InputSignal<string>;
  /**
   * Emitted on the element once the text is in the clipboard, with the text as detail.
   */
  @Event()
  public accessor copied!: Output<string>;
  /**
   * Copies the text: a stable reference, so that the same function can be removed.
   */
  private readonly _copy = async (): Promise<void> => {
    const text = this.text();
    await navigator.clipboard.writeText(text);
    this.copied.emit(text);
  };

  /**
   * Here the element is set, the inputs are bound and the listeners of the template are in place.
   */
  public onInit(): void {
    this.element.addEventListener('click', this._copy);
    this.effect(() => {
      this.element.title = \`Copy "\${this.text()}"\`;
    });
  }

  /**
   * Leaves the element as it found it. The effect is disposed right after, on its own.
   */
  public onDestroy(): void {
    this.element.removeEventListener('click', this._copy);
    this.element.removeAttribute('title');
  }
}`
};

/**
 * The snippet `directive-create-component.ts`, shown by the API reference of core.
 */
export const DIRECTIVE_CREATE_COMPONENT: SourceFile = {
  name: 'directive-create-component.ts',
  lang: 'ts',
  code: `// tooltip.directive.ts
/**
 * Shows a tooltip with a text for as long as it is applied to an element.
 */
@Directive({ selector: 'exTooltip' })
export class TooltipDirective extends CustomDirective<HTMLElement> {
  /**
   * The text of the tooltip.
   */
  @Property('')
  public accessor text!: InputSignal<string>;

  /**
   * Creates the tooltip: it is destroyed when the directive stops, right after onDestroy and the effects.
   */
  public onInit(): void {
    this.createComponent(TooltipComponent, {
      target: document.body,
      properties: [{ text: () => this.text(), anchor: () => this.element }]
    });
  }
}`
};

/**
 * The snippet `directive-kinds.ts`, shown by the API reference of core.
 */
export const DIRECTIVE_KINDS: SourceFile = {
  name: 'directive-kinds.ts',
  lang: 'ts',
  code: `// tint.directive.ts
/**
 * A custom directive, applied with @@exTint: it acts on the element.
 */
@Directive({ selector: 'exTint' })
export class TintDirective extends CustomDirective<HTMLElement> {
  /**
   * The background color.
   */
  @Property('#fde68a')
  public accessor color!: InputSignal<string>;

  /**
   * Keeps the background in sync with the input.
   */
  public onInit(): void {
    this.effect(() => {
      this.element.style.backgroundColor = this.color();
    });
  }
}

// visible-when.directive.ts
/**
 * A structural directive, applied with *exVisibleWhen: it decides whether the element exists.
 */
@Directive({ selector: 'exVisibleWhen' })
export class VisibleWhenDirective extends StructuralDirective {
  /**
   * Whether the element is rendered.
   */
  @Property(false)
  public accessor condition!: InputSignal<boolean>;

  /**
   * Evaluated again whenever the condition changes.
   *
   * @returns The condition.
   */
  public shouldRender(): boolean {
    return this.condition();
  }
}`
};

/**
 * The snippet `host-bindings-directive.ts`, shown by the page components/host-bindings and the page directives/custom and the API reference of core.
 */
export const HOST_BINDINGS_DIRECTIVE: SourceFile = {
  name: 'host-bindings-directive.ts',
  lang: 'ts',
  code: `// copy.directive.ts
/**
 * Copies a text to the clipboard when the element is clicked. The listener and the title are bound to the element by
 * the decorators: no onInit, and nothing to undo in onDestroy.
 */
@Directive({ selector: 'exCopy' })
export class CopyDirective extends CustomDirective<HTMLButtonElement> {
  /**
   * The text to copy.
   */
  @Property.required()
  public accessor text!: InputSignal<string>;
  /**
   * Emitted on the element once the text is in the clipboard, with the text as detail.
   */
  @Event()
  public accessor copied!: Output<string>;

  /**
   * The title of the element, written again when the text changes, and removed when the directive is destroyed.
   *
   * @returns The tooltip of the element.
   */
  @HostProperty('title')
  public get hint(): string {
    return \`Copy "\${this.text()}"\`;
  }

  /**
   * Copies the text. Listens to the clicks on the element until the directive is destroyed.
   */
  @HostListener('click')
  public async copy(): Promise<void> {
    const text = this.text();
    await navigator.clipboard.writeText(text);
    this.copied.emit(text);
  }
}`
};

/**
 * The snippet `host-directive-members.ts`, shown by the API reference of core.
 */
export const HOST_DIRECTIVE_MEMBERS: SourceFile = {
  name: 'host-directive-members.ts',
  lang: 'ts',
  code: `// field.xd.component.ts
/**
 * A field with a tooltip, whose inputs and output are bound on the tag of the field.
 */
@WebComponent({
  selector: 'ex-field',
  hostDirectives: [{
    directive: TooltipDirective,
    properties: ['position', { name: 'text', alias: 'hint' }], // position as it is, text as hint
    events: [{ name: 'shown', alias: 'hintShown' }]            // dispatched on ex-field as hintShown
  }],
  templateUrl: './field.xd.component.html'
})
export class FieldComponent extends CustomElement {}`
};

/**
 * The snippet `host-listener.ts`, shown by the page components/host-bindings and the API reference of core.
 */
export const HOST_LISTENER: SourceFile = {
  name: 'host-listener.ts',
  lang: 'ts',
  code: `/**
 * A method without parameters: the event is not needed.
 */
@HostListener('click')
public toggle(): void {
  this.on.update(on => !on);
}

/**
 * The name gives the type of the event: KeyboardEvent for keydown, MouseEvent for click.
 *
 * @param event - The key pressed while the host has the focus.
 */
@HostListener('keydown')
public onKeydown(event: KeyboardEvent): void {
  switch (event.key) {
    case ' ':
    case 'Enter':
      event.preventDefault();
      this.toggle();
      break;
  }
}

/**
 * An output of the component itself is dispatched on the host too.
 *
 * @param event - The output, with its detail.
 */
@HostListener('checkedChange')
public log(event: CustomEvent<boolean>): void {
  console.log(event.detail);
}

/**
 * The options of addEventListener: capture, once and passive. The same method can listen to several events.
 */
@HostListener('pointerup', { passive: true })
@HostListener('pointercancel', { passive: true })
public release(): void {
  this.pressed.set(false);
}`
};

/**
 * The snippet `host-listener-targets.ts`, shown by the page components/host-bindings and the API reference of core.
 */
export const HOST_LISTENER_TARGETS: SourceFile = {
  name: 'host-listener-targets.ts',
  lang: 'ts',
  code: `/**
 * Closes the menu on a click anywhere in the page, outside of it. The listener is on the document while the host is
 * connected.
 *
 * @param event - The click, a MouseEvent of DocumentEventMap.
 */
@HostListener('document:click')
public closeOutside(event: MouseEvent): void {
  if (!event.composedPath().includes(this)) {
    this.open.set(false);
  }
}

/**
 * Follows the width of the window. The listener is on the window while the host is connected.
 *
 * @param event - The resize, a UIEvent of WindowEventMap.
 */
@HostListener('window:resize', { passive: true })
public onResize(_event: UIEvent): void {
  this.compact.set(window.innerWidth < 600);
}

// ✗ a type error: a click is a MouseEvent, not a KeyboardEvent
@HostListener('click')
public onClick(event: KeyboardEvent): void { … }`
};

/**
 * The snippet `host-property-values.ts`, shown by the page components/host-bindings and the API reference of core.
 */
export const HOST_PROPERTY_VALUES: SourceFile = {
  name: 'host-property-values.ts',
  lang: 'ts',
  code: `/**
 * true writes hidden="", false removes it: the way of boolean attributes.
 *
 * @returns Whether the host is hidden.
 */
@HostProperty('hidden')
public get collapsed(): boolean {
  return !this.open();
}

/**
 * An aria-* attribute writes a boolean as the text "true" or "false".
 *
 * @returns Whether the content is expanded.
 */
@HostProperty('aria-expanded')
public get expandedState(): boolean {
  return this.open();
}

/**
 * Numbers are written as strings; null and undefined remove the attribute.
 *
 * @returns The number of items, or null when there is none.
 */
@HostProperty('data-count')
public get count(): number | null {
  return this.items().length || null;
}`
};

/**
 * The snippet `host-property.ts`, shown by the API reference of core.
 */
export const HOST_PROPERTY: SourceFile = {
  name: 'host-property.ts',
  lang: 'ts',
  code: `/**
 * Reads no signal: written once, each time the element is connected.
 */
@HostProperty('role')
public readonly hostRole = 'switch';
/**
 * Holds a signal: called to get the value, and written again when it changes. The host has the class on while it is true.
 */
@HostProperty('class.on')
public readonly on = signal(false);
/**
 * An input reflected on the host: the accessor holds an InputSignal, called as well.
 */
@HostProperty('size')
@Property<InputSignal<'small' | 'large'>>('small')
public accessor size!: InputSignal<'small' | 'large'>;

/**
 * Written again whenever a signal it reads changes.
 *
 * @returns The label read by assistive technologies.
 */
@HostProperty('aria-label')
public get stateLabel(): string {
  return this.on() ? 'Turn off' : 'Turn on';
}`
};

/**
 * The snippet `model-create-component.ts`, shown by the API reference of core.
 */
export const MODEL_CREATE_COMPONENT: SourceFile = {
  name: 'model-create-component.ts',
  lang: 'ts',
  code: `this.createComponent(StepperComponent, {
  target: this.list,
  // The model, bound as any input: by its name, or by its alias
  properties: [{ value: () => this.quantity() }],
  // Its event of change, whose detail is typed as the model
  events: [{ valueChange: event => this.quantity.set(event.detail) }]
});`
};

/**
 * The snippet `model-directive.ts`, shown by the API reference of core.
 */
export const MODEL_DIRECTIVE: SourceFile = {
  name: 'model-directive.ts',
  lang: 'ts',
  code: `// toggle.directive.ts
/**
 * Switches a boolean at each click of its element: templates bind it with @@exToggle([(on)]="enabled").
 */
@Directive({ selector: 'exToggle' })
export class ToggleDirective extends CustomDirective<HTMLElement> {
  /**
   * Whether the toggle is on. Its event of change, onChange, is dispatched on the element of the directive.
   */
  @Model(false, { alias: 'on' })
  public accessor active!: Aliased<ModelSignal<boolean>, 'on'>;

  /**
   * Switches the value, dispatching onChange.
   */
  @HostListener('click')
  public toggle(): void {
    this.active.update(active => !active);
  }
}`
};

/**
 * The snippet `model-host-directive.ts`, shown by the API reference of core.
 */
export const MODEL_HOST_DIRECTIVE: SourceFile = {
  name: 'model-host-directive.ts',
  lang: 'ts',
  code: `// toggle-button.xd.component.ts
/**
 * A button switching on and off: it exposes the model of ToggleDirective, so templates bind [(on)]="enabled" on its tag.
 */
@WebComponent({
  selector: 'ex-toggle-button',
  hostDirectives: [{ directive: ToggleDirective, properties: ['on'], events: ['onChange'] }],
  templateUrl: './toggle-button.xd.component.html'
})
export class ToggleButtonComponent extends CustomElement {}`
};

/**
 * The snippet `output-emit.ts`, shown by the API reference of core.
 */
export const OUTPUT_EMIT: SourceFile = {
  name: 'output-emit.ts',
  lang: 'ts',
  code: `/**
 * A booking, emitted as the detail: an object with a cancelable key of its own.
 */
@Event()
public accessor booked!: Output<{ seats: number; cancelable: boolean }>;
/**
 * An event without a detail.
 */
@Event()
public accessor closed!: Output;

// All of it is the detail: the event is not cancelable
this.booked.emit({ seats: 2, cancelable: true });
// The options of the emission follow the detail
this.booked.emit({ seats: 2, cancelable: true }, new EventOptions({ cancelable: true }));
// An instance of EventOptions as the only argument: the options of the emission
this.closed.emit(new EventOptions({ bubbles: true }));
// A plain object is never taken for the options
this.closed.emit({ bubbles: true });
// ✗ Argument of type '[{ bubbles: true; }]' is not assignable to parameter of type '[] | [EventOptions]'.`
};

/**
 * The snippet `query-content-options.ts`, shown by the API reference of core.
 */
export const QUERY_CONTENT_OPTIONS: SourceFile = {
  name: 'query-content-options.ts',
  lang: 'ts',
  code: `/**
 * The first element with the header attribute, among the children and their descendants.
 */
@Query.content('[header]')
public accessor header!: QuerySignal<HTMLElement | null>;
/**
 * The buttons passed for the footer slot: slot is an attribute like any other.
 */
@Query.contentAll<HTMLButtonElement>('button[slot="footer"]')
public accessor actions!: QuerySignal<HTMLButtonElement[]>;
/**
 * The children with the item attribute: the default of the .all variant.
 */
@Query.contentAll('[item]')
public accessor items!: QuerySignal<HTMLElement[]>;
/**
 * Every element with the item attribute, at any depth.
 */
@Query.contentAll('[item]', { descendants: true })
public accessor allItems!: QuerySignal<HTMLElement[]>;`
};

/**
 * The snippet `query-content.ts`, shown by the API reference of core.
 */
export const QUERY_CONTENT: SourceFile = {
  name: 'query-content.ts',
  lang: 'ts',
  code: `// tab-group.xd.component.ts
/**
 * Tabs built from the panels the parent passes to the group.
 */
@WebComponent({
  selector: 'ex-tab-group',
  templateUrl: './tab-group.xd.component.html'
})
export class TabGroupComponent extends CustomElement {
  /**
   * Every panel passed to the group, typed as its class: empty until the parent creates the content.
   */
  @Query.contentAll(TabPanelComponent)
  public accessor panels!: QuerySignal<TabPanelComponent[]>;
  /**
   * The label of each tab, following the panels as they arrive.
   */
  public readonly labels = computed(() => this._computeLabels());

  /**
   * Computes the value of \`labels\`.
   *
   * @returns The label of each panel.
   */
  private _computeLabels(): string[] {
    return this.panels().map(panel => panel.label());
  }
}`
};

/**
 * The snippet `query-read.ts`, shown by the page components/queries and the API reference of core-signals and the API reference of core.
 */
export const QUERY_READ: SourceFile = {
  name: 'query-read.ts',
  lang: 'ts',
  code: `/**
 * The directive applied to the first element the selector finds that has it.
 */
@Query('.help', { read: TooltipDirective })
public accessor helpTooltip!: QuerySignal<TooltipDirective | null>;
/**
 * The element a directive is applied to, typed by the type argument.
 */
@Query<HTMLButtonElement>(TooltipDirective, { read: 'element' })
public accessor withTooltip!: QuerySignal<HTMLButtonElement | null>;
/**
 * The directive applied to the element an element ref names.
 */
@Query.refRequired('field', { read: TooltipDirective })
public accessor fieldTooltip!: QuerySignal<TooltipDirective>;
/**
 * Together with the options of the content.
 */
@Query.content('.tab', { descendants: false, read: TooltipDirective })
public accessor tabTooltip!: QuerySignal<TooltipDirective | null>;
/**
 * Not on the .all variants: TypeScript rejects the option.
 */
@Query.all('.help', { read: TooltipDirective })
public accessor tooltips!: QuerySignal<TooltipDirective[]>;`
};

/**
 * The snippet `query-timing.ts`, shown by the API reference of core.
 */
export const QUERY_TIMING: SourceFile = {
  name: 'query-timing.ts',
  lang: 'ts',
  code: `/**
 * The field of the editor, rendered by an @if only while editing.
 */
@Query<HTMLInputElement>('input')
public accessor field!: QuerySignal<HTMLInputElement | null>;

/**
 * Before the render: the query is still empty.
 */
public onInit(): void {
  console.log(this.field()); // null
  // Runs again when the query is filled, and each time the field appears or disappears
  this.effect(() => {
    this.field()?.focus();
  });
}

/**
 * After the render: the query holds the field, if the template renders it.
 */
public afterRender(): void {
  console.log(this.field());
}`
};

/**
 * The snippet `structural-directive.ts`, shown by the API reference of core.
 */
export const STRUCTURAL_DIRECTIVE: SourceFile = {
  name: 'structural-directive.ts',
  lang: 'ts',
  code: `// can-edit.directive.ts
/**
 * Renders the element only when the server allows the user to edit the document.
 */
@Directive({ selector: 'exCanEdit' })
export class CanEditDirective extends StructuralDirective {
  /**
   * The document to check.
   */
  @Property.required()
  public accessor documentId!: InputSignal<string>;

  /**
   * Asks the server: evaluated again whenever the document changes.
   *
   * @returns Whether the user can edit the document.
   */
  public async shouldRender(): Promise<boolean> {
    // Read before the first await, so it is tracked: the signals read after it are not
    const documentId = this.documentId();
    try {
      const response = await fetch(\`/api/documents/\${documentId}/permissions\`);
      const permissions: { canEdit: boolean } = await response.json();
      return permissions.canEdit;
    } catch {
      // A rejected promise would keep the previous outcome: a failure hides the element instead
      return false;
    }
  }
}`
};
