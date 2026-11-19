import type { Style } from '../../../../types/style.type';

/**
 * Generates the content of the project's global stylesheet, `styles.<style>`.
 *
 * This file contains the base styles for the project, including
 * resetting margins and setting the box-sizing for all elements.
 * CSS, SCSS and Less share the same syntax; Sass uses the indented one.
 *
 * @param style - The stylesheet format of the project.
 * @returns The content of the global stylesheet.
 */
export function styles(style: Style): string {
  if (style === 'sass') {
    return `html, body
  margin: 0
  height: 100%

*
  box-sizing: border-box
`;
  }

  return `html,
body {
  margin: 0;
  height: 100%;
}

* {
  box-sizing: border-box;
}`;
}
