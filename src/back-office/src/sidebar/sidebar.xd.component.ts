import { CustomDirective, CustomElement, Directive, Event, Output, Property, WebComponent } from '@xaendar/core';
import { effect, InputSignal, signal } from '@xaendar/core/signals';
import { Function, VoidFunction } from '@xaendar/types';

export type NavItem = {
  label: string;
  icon: string; // nome icona (vedi mappa SVG nel template)
  route: string;
  badge?: string | number;
}

@WebComponent({
  selector: 'app-sidebar',
  styleUrl: './sidebar.component.css',
  templateUrl: './sidebar.xd.component.html',
})
export class SidebarComponent extends CustomElement {
  @Property(true)
  public accessor enableDrag!: InputSignal<boolean>;

  @Property('Default value without binding')
  public accessor text!: InputSignal<string>;

  @Property('Default value without binding')
  public accessor text2!: InputSignal<string>;

  @Property.required({ alias: 'collapsed' })
  public accessor inputCollapsed!: InputSignal<boolean>;

  @Event()
  public accessor collapsedChange!: Output<boolean>;

  @Property([
    { label: 'Dashboard', icon: 'grid', route: '/dashboard' },
    { label: 'Progetti', icon: 'folder', route: '/progetti' },
    { label: 'Attività', icon: 'check', route: '/attivita', badge: 4 },
    { label: 'Team', icon: 'users', route: '/team' },
    { label: 'Report', icon: 'chart', route: '/report' },
    { label: 'Impostazioni', icon: 'settings', route: '/impostazioni' }
  ] as NavItem[])
  public accessor navItems!: InputSignal<NavItem[]>

  public readonly collapsed = signal(false);

  constructor() {
    super();
    effect(() => this.collapsed.set(this.inputCollapsed()));
  }

  public toggle(): void {
    this.collapsed.update(value => !value);
    this.collapsedChange.emit(this.collapsed());
  }

  public transform(input: string): string {
    return input.toUpperCase();
  }

  input = signal('Test');

  public onInit() {
    return;
  }

  public onClick(): void {
    this.input.update(value => value + value);
  }
}

// @Directive({
//   selector: 'dragDirective'
// })
// export class DragDirective extends CustomDirective {

//   private _startMouseX = 0;
//   private _startMouseY = 0;
//   private _startTop = 0;
//   private _startLeft = 0;

//   public bindings: Record<string, Function> = {};

//   public onInit(): Array<VoidFunction> | void {
//     const onDragStart = this._onDragStart.bind(this);
//     const onDrag = this._onDrag.bind(this);

//     this.element.style.position = 'relative';
//     this.element.setAttribute('draggable', 'true');
//     this.element.addEventListener('dragstart', onDragStart);
//     this.element.addEventListener('drag', onDrag);

//     return [
//       () => this.element.removeAttribute('draggable'),
//       () => this.element.removeEventListener('dragstart', onDragStart),
//       () => this.element.removeEventListener('drag', onDrag),
//       this._resetPosition.bind(this)
//     ]
//   }

//   private _onDragStart(event: DragEvent) {
//     this._startMouseX = event.clientX;
//     this._startMouseY = event.clientY;
//     this._startTop = parseFloat(this.element.style.top) || 0;
//     this._startLeft = parseFloat(this.element.style.left) || 0;
//   }

//   private _onDrag(event: DragEvent) {
//     // L'ultimo evento drag arriva con coordinate (0, 0): va ignorato
//     if (event.clientX === 0 && event.clientY === 0) {
//       return;
//     }

//     this.element.style.top = `${this._startTop + event.clientY - this._startMouseY}px`;
//     this.element.style.left = `${this._startLeft + event.clientX - this._startMouseX}px`;
//   }

//   private _resetPosition(): void {
//     this.element.style.top = '';
//     this.element.style.left = '';
//   }

//   public onDestroy(): void {
//     this.element.removeAttribute('draggable'),
//     this.element.removeEventListener('dragstart', onDragStart),
//     this.element.removeEventListener('drag', onDrag),
//     this._resetPosition.bind(this)
//   }
// }