import { CustomElement, WebComponent } from '@xaendar/core';

/**
 * The "Next steps" page, in English.
 */
@WebComponent({
  selector: 'page-essentials-next-steps-en',
  templateUrl: './next-steps.en.xd.component.html',
  styleUrl: '../../page.css'
})
export class EssentialsNextStepsPageEn extends CustomElement {}

/**
 * The "Next steps" page, in Italian.
 */
@WebComponent({
  selector: 'page-essentials-next-steps-it',
  templateUrl: './next-steps.it.xd.component.html',
  styleUrl: '../../page.css'
})
export class EssentialsNextStepsPageIt extends CustomElement {}
