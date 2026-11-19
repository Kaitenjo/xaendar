import { CustomElement, WebComponent } from '@xaendar/core';

/**
 * A button reading its color and its corners from custom properties, with fallbacks.
 */
@WebComponent({
  selector: 'ex-themed-button',
  styleUrl: './themed-button.css',
  templateUrl: './themed-button.xd.component.html'
})
export class ThemedButtonComponent extends CustomElement {}
