import { CustomDirective, CustomElement, Directive, Event, Output, Property, WebComponent } from '@xaendar/core';
import { effect, InputSignal, signal } from '@xaendar/core/signals';
import { VoidFunction } from '@xaendar/types';

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
  
  public onClick(): void {
    this.input.update(value => value + value);
  }
}

@Directive({ 
  selector: 'app-sidebar' 
})
export class StyleDirective extends CustomDirective {
  public readonly display = signal<('block' | 'inline' | 'none')>('block');
  
  public reactToChanges(): Array<VoidFunction> | undefined {
    return [
      effect(() => {
        this.element.style.display = this.display();
      })
    ];
  }
}