import { CustomElement, WebComponent } from '@xaendar/core';

/**
 * A button reading its color and its corners from custom properties, with fallbacks.
 */
@WebComponent({
  selector: 'ex-themed-button',
  templateUrl: './themed-button.xd.component.html',
  styleUrl: './themed-button.css'
})
export class ThemedButtonComponent extends CustomElement {}
