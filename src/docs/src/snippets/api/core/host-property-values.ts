/**
 * true writes hidden="", false removes it: the way of boolean attributes.
 *
 * @returns Whether the host is hidden.
 */
@HostProperty('hidden')
public get collapsed(): boolean {
  return !this.open();
}

/**
 * ARIA states want the text "false", which false would remove: write the string.
 *
 * @returns 'true' or 'false'.
 */
@HostProperty('aria-expanded')
public get expandedState(): string {
  return String(this.open());
}

/**
 * Numbers are written as strings; null and undefined remove the attribute.
 *
 * @returns The number of items, or null when there is none.
 */
@HostProperty('data-count')
public get count(): number | null {
  return this.items().length || null;
}
