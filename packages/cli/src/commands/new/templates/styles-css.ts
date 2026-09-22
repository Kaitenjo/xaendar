/**
 * Generates the content of the project's `styles.css`.
 *
 * This file contains the base styles for the project, including
 * resetting margins and setting the box-sizing for all elements.
 *
 * @returns The content of the `styles.css` file.
 */
export function stylesCss(): string {
  return `html,
body {
  margin: 0;
  height: 100%;
}

* {
  box-sizing: border-box;
}`;
}
