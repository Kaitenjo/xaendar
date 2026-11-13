/**
 * The classes toggled on each element by its class bindings (`[class.name]`), each with whether the element has it.
 * Writing the `class` attribute replaces every class of the element, so they are toggled again after each write.
 */
const toggledClasses = new WeakMap<Element, Map<string, boolean>>();

/**
 * The style properties set on each element by its style bindings (`[style.name]`), each with its value. Writing the
 * `style` attribute replaces every property of the element, so they are set again after each write.
 */
const boundStyles = new WeakMap<Element, Map<string, string>>();

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
 * Sets a style property of an element, remembering it so that writing the `style` attribute does not drop it, or
 * removes it for `null`, forgetting it. The property is written only when the element does not hold the value, as an
 * element adopted from the HTML rendered on the server already holds it.
 *
 * @param element - The element.
 * @param property - The name of the property, a custom property (`--name`) included.
 * @param value - The value, with its unit, `null` to remove the property.
 */
export function setStyle(element: Element, property: string, value: string | null): void {
  const { style } = element as HTMLElement;
  if (value === null) {
    unsetStyle(element, property);
    return;
  }

  let styles = boundStyles.get(element);
  if (!styles) {
    styles = new Map();
    boundStyles.set(element, styles);
  }

  styles.set(property, value);
  if (style.getPropertyValue(property) !== value) {
    style.setProperty(property, value);
  }
}

/**
 * Removes a style property set on an element, forgetting it.
 *
 * @param element - The element.
 * @param property - The name of the property.
 */
export function unsetStyle(element: Element, property: string): void {
  boundStyles.get(element)?.delete(property);
  const { style } = element as HTMLElement;
  if (style.getPropertyValue(property)) {
    style.removeProperty(property);
  }
}

/**
 * Applies again the bindings of an element after an attribute of it has been written: the classes toggled by its class
 * bindings when it is `class`, the properties set by its style bindings when it is `style`. A binding wins over what
 * the attribute holds.
 *
 * @param element - The element.
 * @param attribute - The name of the attribute written.
 */
export function restoreBindings(element: Element, attribute: string): void {
  switch (attribute) {
    case 'class': {
      const classes = toggledClasses.get(element);
      if (classes?.size) {
        for (const [name, force] of classes) {
          element.classList.toggle(name, force);
        }
      }
      break;
    }

    case 'style': {
      const styles = boundStyles.get(element);
      if (styles?.size) {
        const { style } = element as HTMLElement;
        for (const [property, value] of styles) {
          style.setProperty(property, value);
        }
      }
      break;
    }
  }
}

/**
 * Writes an attribute of an element, only when it differs from the one the element holds, so that an element adopted
 * from the HTML rendered on the server is written only where the browser renders another value. Writing `class` keeps
 * the classes toggled by class bindings, and the attribute holds the value when it holds the same classes, toggled
 * ones included, in any order; writing `style` keeps the properties set by style bindings, and the attribute holds the
 * value when it holds the same properties, bound ones included.
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
  restoreBindings(element, name);
}

/**
 * Tells whether an element holds an attribute with a value: the same text, or, for `class` on an element toggling
 * classes, the same classes once toggled, and, for `style` on an element setting style properties, the same
 * properties once set.
 *
 * @param element - The element.
 * @param name - The name of the attribute.
 * @param value - The value, `null` for no attribute.
 * @returns `true` when writing the value would not change the element.
 */
function holdsAttribute(element: Element, name: string, value: string | null): boolean {
  const current = element.getAttribute(name);
  if (current === null || value === null) {
    return current === value;
  }

  switch (name) {
    case 'class':
      return holdsClasses(element, value);

    case 'style':
      return holdsStyles(element, value);

    default:
      return current === value;
  }
}

/**
 * Tells whether an element holds the classes a value of its `class` attribute lists, once its class bindings toggle
 * theirs, in any order.
 *
 * @param element - The element.
 * @param value - The value of the attribute.
 * @returns `true` when writing the value would not change the element.
 */
function holdsClasses(element: Element, value: string): boolean {
  const classes = toggledClasses.get(element);
  if (!classes?.size) {
    return element.getAttribute('class') === value;
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

/**
 * Tells whether an element holds the properties a value of its `style` attribute declares, once its style bindings
 * set theirs.
 *
 * @param element - The element.
 * @param value - The value of the attribute.
 * @returns `true` when writing the value would not change the element.
 */
function holdsStyles(element: Element, value: string): boolean {
  const styles = boundStyles.get(element);
  if (!styles?.size) {
    return element.getAttribute('style') === value;
  }

  const expected = new Map<string, string>();
  const declarations = value.split(';');
  for (let i = 0; i < declarations.length; i++) {
    const declaration = declarations[i];
    const colon = declaration.indexOf(':');
    if (colon !== -1) {
      expected.set(declaration.slice(0, colon).trim(), declaration.slice(colon + 1).trim());
    }
  }

  for (const [property, bound] of styles) {
    expected.set(property, bound);
  }

  const { style } = element as HTMLElement;
  if (style.length !== expected.size) {
    return false;
  }

  for (const [property, expectedValue] of expected) {
    if (style.getPropertyValue(property) !== expectedValue) {
      return false;
    }
  }

  return true;
}
