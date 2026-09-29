
/**
 * Configuration object accepted by the `@WebComponent` decorator.
 */
export type WebComponentOptions = {
  /** 
   * The custom element selector used to register the component in the browser.
   * A custom element name, as a class, can be defined only once: it must be unique across every component.
   */
  selector: string,
  /** 
   * Optional path to the component's stylesheet, relative to the component file. 
   */
  styleUrl?: string,
  /** 
   * Path to the component's HTML template, relative to the component file. 
   */
  templateUrl: string
}
