import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * The button of the page: its content is projected, its click is the native one.
 */
@Component({
  selector: 'ui-button',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: '../../../shared/button.css',
  template: `
    <button class="ui-button" [class.ui-button--primary]="variant() === 'primary'" [class.ui-button--secondary]="variant() !== 'primary'" type="button">
      <ng-content />
    </button>
  `
})
export class UiButton {
  /**
   * `primary` or `secondary`.
   */
  public readonly variant = input('secondary');
}
