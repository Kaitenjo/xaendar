import { CustomElement, WebComponent } from '@xaendar/core';

/**
 * The "Coming from Angular" page, in English.
 */
@WebComponent({
  selector: 'page-reference-coming-from-angular-en',
  templateUrl: './coming-from-angular.en.xd.component.html',
  styleUrl: '../../page.css'
})
export class ReferenceComingFromAngularPageEn extends CustomElement {}

/**
 * The "Coming from Angular" page, in Italian.
 */
@WebComponent({
  selector: 'page-reference-coming-from-angular-it',
  templateUrl: './coming-from-angular.it.xd.component.html',
  styleUrl: '../../page.css'
})
export class ReferenceComingFromAngularPageIt extends CustomElement {}
