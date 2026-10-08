import { CustomElement, WebComponent } from '@xaendar/core';

/**
 * SVG circles growing under the pointer.
 */
@WebComponent({
  selector: 'ex-bubbles',
  templateUrl: './bubbles.xd.component.html',
  styleUrl: './bubbles.css'
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
