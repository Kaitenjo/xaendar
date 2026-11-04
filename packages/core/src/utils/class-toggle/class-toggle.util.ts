/**
 * The classes toggled on each element by its class bindings (`[class.name]`), each with whether the element has it.
 * Writing the `class` attribute replaces every class of the element, so they are toggled again after each write.
 */
const toggledClasses = new WeakMap<Element, Map<string, boolean>>();

/**
 * Toggles a class on an element, remembering it so that writing the `class` attribute does not drop it. The `class`
 * attribute is written only when the element does not have the class as it should, as an element adopted from the HTML
 * rendered on the server already has it.
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
  if (element.classList.contains(name) !== force) {
    element.classList.toggle(name, force);
  }
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

/**
 * Writes an attribute of an element, only when it differs from the one the element holds, so that an element adopted
 * from the HTML rendered on the server is written only where the browser renders another value. Writing `class` keeps
 * the classes toggled by class bindings, and the attribute holds the value when it holds the same classes, toggled
 * ones included, in any order.
 *
 * @param element - The element.
 * @param name - The name of the attribute.
 * @param value - The value, `null` to remove the attribute.
 */
export function updateAttribute(element: Element, name: string, value: string | null): void {
  if (holdsAttribute(element, name, value)) {
    return;
  }

  value === null ? element.removeAttribute(name) : element.setAttribute(name, value);
  restoreToggledClasses(element, name);
}

/**
 * Tells whether an element holds an attribute with a value: the same text, or, for `class` on an element toggling
 * classes, the same classes once toggled.
 *
 * @param element - The element.
 * @param name - The name of the attribute.
 * @param value - The value, `null` for no attribute.
 * @returns `true` when writing the value would not change the element.
 */
function holdsAttribute(element: Element, name: string, value: string | null): boolean {
  const current = element.getAttribute(name);
  const classes = name === 'class' ? toggledClasses.get(element) : undefined;
  if (!classes?.size || current === null || value === null) {
    return current === value;
  }

  const expected = new Set(value.split(/\s+/).filter(Boolean));
  for (const [className, force] of classes) {
    force ? expected.add(className) : expected.delete(className);
  }

  const { classList } = element;
  if (classList.length !== expected.size) {
    return false;
  }

  for (const className of expected) {
    if (!classList.contains(className)) {
      return false;
    }
  }

  return true;
}
