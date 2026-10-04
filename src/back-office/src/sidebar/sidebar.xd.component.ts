import { CustomElement, Event, Output, Property, WebComponent } from '@xaendar/core';
import { InputSignal, signal } from '@xaendar/core/signals';

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

  public toggle(): void {
    this.collapsed.update(value => !value);
    this.collapsedChange.emit(this.collapsed());
  }

  public onInit(): void {
    this.effect(() => this.collapsed.set(this.inputCollapsed()));
  }
}
