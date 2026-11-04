/**
 * A custom element written without Xaendar, standing for one from a third-party library: it reads the rating from its
 * `count` attribute, and dispatches a `vanilla-change` event carrying the rating of the star clicked.
 */
export class VanillaStars extends HTMLElement {
  /**
   * The attributes whose changes the element renders.
   */
  public static readonly observedAttributes = ['count'];

  /**
   * Renders the stars when the element is connected.
   */
  public connectedCallback(): void {
    this._render();
  }

  /**
   * Renders the stars again when the `count` attribute changes.
   */
  public attributeChangedCallback(): void {
    this._render();
  }

  /**
   * Writes one button per star, filling the stars up to the rating.
   */
  private _render(): void {
    const count = Number(this.getAttribute('count') ?? 0);
    const stars = [1, 2, 3, 4, 5].map(value => {
      const star = document.createElement('button');
      star.type = 'button';
      star.textContent = value <= count ? '★' : '☆';
      star.ariaLabel = `${value} of 5`;
      star.addEventListener('click', () => this.dispatchEvent(new CustomEvent('vanilla-change', { detail: value })));
      return star;
    });
    this.replaceChildren(...stars);
  }
}

if (!customElements.get('vanilla-stars')) {
  customElements.define('vanilla-stars', VanillaStars);
}
