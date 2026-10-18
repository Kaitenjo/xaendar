import type { ContainsChar } from '@xaendar/types';

/**
 * A class name: a literal containing a space resolves to never.
 */
type ClassName<Name extends string> = ContainsChar<Name, ' '> extends true ? never : Name;

/**
 * Adds one class to an element.
 *
 * @param element - The element.
 * @param name - The class: a literal with a space does not compile.
 */
function addClass<Name extends string>(element: Element, name: ClassName<Name>): void {
  element.classList.add(name);
}

addClass(button, 'primary');       // ✓
addClass(button, 'primary large'); // ✗ Argument of type '"primary large"' is not assignable to parameter of type 'never'.
addClass(button, className);       // ✓ a string that is not a literal is not checked
