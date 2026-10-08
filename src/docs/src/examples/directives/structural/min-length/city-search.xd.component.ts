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
   * The cities to search.
   */
  private readonly cities = ['Milan', 'Rome', 'Turin', 'Naples', 'Palermo', 'Genoa', 'Bologna', 'Florence', 'Bari', 'Venice'];

  /**
   * The text typed.
   */
  public readonly query = signal('');

  /**
   * The cities containing the text.
   */
  public readonly results = computed(() => {
    const query = this.query().trim().toLowerCase();
    return this.cities.filter(city => city.toLowerCase().includes(query));
  });

  /**
   * Stores the text typed.
   *
   * @param event - The input event.
   */
  public type(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
  }
}
