import { BaseWebComponent, Event, Output, WebComponent } from "@xaendar/core";
import { signal } from "@xaendar/core/signals";

export type AppUser = {
  name: string;
  role: string;
  avatarUrl?: string;
}

@WebComponent({
  selector: 'app-topbar',
  styleUrl: './topbar.component.css',
  templateUrl: './topbar.xd.component.html'
})
export class TopbarComponent extends BaseWebComponent {
  @Event() 
  public accessor menuToggle!: Output;

  public readonly isUserMenuOpen = signal(false);

  public readonly isNotificationsOpen = signal(false);

  user: AppUser = {
    name: 'Dario Spinosa',
    role: 'Product Manager'
  };

  notificationsCount = 3;

  public toggleUserMenu(): void {
    this.isUserMenuOpen.update(value => !value);
    this.isNotificationsOpen.set(false)
  }

  public toggleNotifications(): void {
    this.isNotificationsOpen.update(value => !value);
    this.isUserMenuOpen.set(false)
  }

  public onMenuToggle(): void {
    this.menuToggle.emit();
  }
}
