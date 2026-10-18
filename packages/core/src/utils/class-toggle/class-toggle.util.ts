/**
 * The classes toggled on each element by its class bindings (`[class.name]`), each with whether the element has it.
 * Writing the `class` attribute replaces every class of the element, so they are toggled again after each write.
 */
const toggledClasses = new WeakMap<Element, Map<string, boolean>>();

/**
 * Toggles a class on an element, remembering it so that writing the `class` attribute does not drop it.
 *
 * @param element - The element.
 * @param name - The name of the class.
 * @param force - Whether the element has the class.
 */
export function toggleClass(element: Element, name: string, force: boolean): void {
  let classes = toggledClasses.get(element);
  if (!classes) {
    classes = new Map();
    toggledClasses.set(element, classes);
  }

  classes.set(name, force);
  element.classList.toggle(name, force);
}

/**
 * Removes a class toggled on an element, forgetting it.
 *
 * @param element - The element.
 * @param name - The name of the class.
 */
export function untoggleClass(element: Element, name: string): void {
  toggledClasses.get(element)?.delete(name);
  element.classList.remove(name);
}

/**
 * Toggles again the classes of an element after an attribute of it has been written, if it is `class`: a class
 * binding wins over the classes the attribute lists.
 *
 * @param element - The element.
 * @param attribute - The name of the attribute written.
 */
export function restoreToggledClasses(element: Element, attribute: string): void {
  const classes = attribute === 'class' ? toggledClasses.get(element) : undefined;
  if (classes?.size) {
    for (const [name, force] of classes) {
      element.classList.toggle(name, force);
    }
  }
}
