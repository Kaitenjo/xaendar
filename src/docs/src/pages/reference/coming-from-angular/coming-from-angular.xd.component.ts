import { CustomElement, WebComponent } from '@xaendar/core';

/**
 * The "Coming from Angular" page.
 */
@WebComponent({
  selector: 'page-reference-coming-from-angular',
  styleUrl: '../../page.css',
  templateUrl: './coming-from-angular.xd.component.html'
})
export class ReferenceComingFromAngularPage extends CustomElement {}
