import { CustomElement, WebComponent } from '@xaendar/core';
import type { CreateComponentOptionsWithOptionalTarget } from '@xaendar/core';
import { signal } from '@xaendar/core/signals';
import { InfoCardComponent } from './info-card.xd.component';
import { WarningCardComponent } from './warning-card.xd.component';

/**
 * The class of a card of the panel.
 */
type CardClass = typeof InfoCardComponent | typeof WarningCardComponent;

/**
 * A panel showing the card of the class chosen, created by `@@componentOutlet` inside the panel.
 */
@WebComponent({
  selector: 'ex-widget-panel',
  styleUrl: './widget-panel.css',
  templateUrl: './widget-panel.xd.component.html'
})
export class WidgetPanelComponent extends CustomElement {
  /**
   * The class of the card shown.
   */
  public readonly card = signal<CardClass>(InfoCardComponent);
  /**
   * The text of the card.
   */
  public readonly heading = signal('Deploy finished');
  /**
   * The options the card is created with: no `target`, so it is appended to the element of the directive. The getter runs
   * in an effect of the card, which follows the text without being created again.
   */
  public readonly options: CreateComponentOptionsWithOptionalTarget<InfoCardComponent | WarningCardComponent> = {
    properties: [{ heading: () => this.heading() }]
  };
  /**
   * The number of the last text given to the card.
   */
  private _renamed = 0;

  /**
   * Shows the information card.
   */
  public showInfo(): void {
    this.card.set(InfoCardComponent);
  }

  /**
   * Shows the warning card.
   */
  public showWarning(): void {
    this.card.set(WarningCardComponent);
  }

  /**
   * Gives the card another text.
   */
  public rename(): void {
    this._renamed += 1;
    this.heading.set(`Deploy #${this._renamed}`);
  }
}
