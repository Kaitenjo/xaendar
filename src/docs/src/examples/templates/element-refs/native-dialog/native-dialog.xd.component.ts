import { CustomElement, WebComponent } from '@xaendar/core';
import { signal } from '@xaendar/core/signals';

/**
 * Opens and closes a native dialog by calling the methods of the element its element ref names.
 */
@WebComponent({
  selector: 'ex-native-dialog',
  styleUrl: './native-dialog.css',
  templateUrl: './native-dialog.xd.component.html'
})
export class NativeDialogComponent extends CustomElement {
  /**
   * How the dialog was closed last.
   */
  public readonly result = signal('Not opened yet');

  /**
   * Records how the dialog was closed.
   *
   * @param returnValue - The value the dialog was closed with.
   */
  public closed(returnValue: string): void {
    this.result.set(`closed with ${JSON.stringify(returnValue)}`);
  }
}
