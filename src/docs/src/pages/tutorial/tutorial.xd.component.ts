import { CustomElement, WebComponent } from '@xaendar/core';

/**
 * The "Tutorial: a todo app" page.
 */
@WebComponent({
  selector: 'page-tutorial',
  styleUrl: '../page.css',
  templateUrl: './tutorial.xd.component.html'
})
export class TutorialPage extends CustomElement {}
