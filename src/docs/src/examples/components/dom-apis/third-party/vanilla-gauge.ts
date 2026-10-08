/**
 * A custom element written without Xaendar, standing for one from a third-party library: it exposes a value
 * property and renders it imperatively.
 */
export class VanillaGauge extends HTMLElement {
  /**
   * The value, from 0 to 100.
   */
  private current = 0;

  /**
   * The value shown.
   *
   * @returns The value.
   */
  public get value(): number {
    return this.current;
  }

  /**
   * Shows a new value.
   *
   * @param value - The value, from 0 to 100.
   */
  public set value(value: number) {
    this.current = value;
    this.render();
  }

  /**
   * Renders the gauge when it is connected.
   */
  public connectedCallback(): void {
    this.render();
  }

  /**
   * Writes the markup of the gauge.
   */
  private render(): void {
    this.style.display = 'block';
    this.innerHTML = '<div style="height:0.8rem;border-radius:999px;background:rgba(127,127,127,.2);overflow:hidden">'
      + '<div style="height:100%;width:' + this.current + '%;background:#f5a524"></div></div>'
      + '<small>vanilla-gauge, value = ' + this.current + '</small>';
  }
}

if (!customElements.get('vanilla-gauge')) {
  customElements.define('vanilla-gauge', VanillaGauge);
}
