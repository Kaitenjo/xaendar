import { CustomElement, WebComponent } from '@xaendar/core';
import { computed, signal } from '@xaendar/core/signals';

/**
 * Search results shown only after three characters.
 */
@WebComponent({
  selector: 'ex-city-search',
  templateUrl: './city-search.xd.component.html',
  styleUrl: './city-search.css'
})
export class CitySearchComponent extends CustomElement {
  /**
   * The text typed.
   */
  public readonly query = signal('');
  /**
   * The cities containing the text.
   */
  public readonly results = computed(() => this._computeResults());
  /**
   * The cities to search.
   */
  private readonly _cities = ['Milan', 'Rome', 'Turin', 'Naples', 'Palermo', 'Genoa', 'Bologna', 'Florence', 'Bari', 'Venice'];

  /**
   * Stores the text typed.
   *
   * @param event - The input event.
   */
  public type(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
  }

  /**
   * Computes the value of `results`.
   *
   * @returns The cities containing the text.
   */
  private _computeResults(): string[] {
    const query = this.query().trim().toLowerCase();
    return this._cities.filter(city => city.toLowerCase().includes(query));
  }
}
