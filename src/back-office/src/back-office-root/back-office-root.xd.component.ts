import { CustomElement, WebComponent } from '@xaendar/core';
import { signal } from '@xaendar/core/signals';

@WebComponent({
  selector: 'back-office-root',
  styleUrl: './back-office-root.xd.component.css',
  templateUrl: './back-office-root.xd.component.html'
})
export class BackOfficeRootComponent extends CustomElement {

  public state = signal(true)
  
  public onClick(): void {
    this.state.update(value => !value)
  }
}