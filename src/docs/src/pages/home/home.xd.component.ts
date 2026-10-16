import { CustomElement, WebComponent } from '@xaendar/core';

/**
 * The home page.
 */
@WebComponent({
  selector: 'page-home',
  styleUrl: '../page.css',
  templateUrl: './home.xd.component.html'
})
export class HomePage extends CustomElement {}
