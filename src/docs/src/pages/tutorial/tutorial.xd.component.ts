import { CustomElement, WebComponent } from '@xaendar/core';

/**
 * The "Tutorial: a todo app" page, in English.
 */
@WebComponent({
  selector: 'page-tutorial-en',
  templateUrl: './tutorial.en.xd.component.html',
  styleUrl: '../page.css'
})
export class TutorialPageEn extends CustomElement {}

/**
 * The "Tutorial: a todo app" page, in Italian.
 */
@WebComponent({
  selector: 'page-tutorial-it',
  templateUrl: './tutorial.it.xd.component.html',
  styleUrl: '../page.css'
})
export class TutorialPageIt extends CustomElement {}
