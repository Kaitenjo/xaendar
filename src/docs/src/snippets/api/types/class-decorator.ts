import type { ClassDecorator, Constructor } from '@xaendar/types';

/**
 * The classes of the pages, by path.
 */
const routes = new Map<string, Constructor<HTMLElement>>();

/**
 * Registers the class of a page under a path.
 *
 * @param path - The path of the page.
 * @returns The decorator.
 */
function Route(path: string): ClassDecorator<HTMLElement> {
  return target => {
    routes.set(path, target);
  };
}

/**
 * ✓ The page of the settings.
 */
@Route('settings')
class SettingsPage extends HTMLElement {}

/**
 * ✗ Unable to resolve signature of class decorator when called as an expression.
 *   Argument of type 'typeof Settings' is not assignable to parameter of type 'Constructor<HTMLElement, { [key: string]: any; }>'.
 */
@Route('settings')
class Settings {}
