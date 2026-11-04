import { CustomElement, WebComponent } from '@xaendar/core';

/**
 * SVG circles growing under the pointer.
 */
@WebComponent({
  selector: 'ex-bubbles',
  styleUrl: './bubbles.css',
  templateUrl: './bubbles.xd.component.html'
})
export class BubblesComponent extends CustomElement {
  /**
   * The circles.
   */
  public readonly circles = [
    { x: 40, y: 50, r: 18, scale: 1.3 },
    { x: 110, y: 50, r: 24, scale: 1.5 },
    { x: 190, y: 50, r: 30, scale: 1.2 }
  ];
}
