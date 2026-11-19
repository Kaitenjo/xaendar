import { CustomElement, WebComponent } from '@xaendar/core';

/**
 * The "Lists and CRUD" page.
 */
@WebComponent({
  selector: 'page-patterns-lists',
  styleUrl: '../../page.css',
  templateUrl: './lists.xd.component.html'
})
export class PatternsListsPage extends CustomElement {}
