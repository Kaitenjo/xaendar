import { isValidCustomElementName } from '@xaendar/common';
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { toComponentClassName } from '../../../utils/component-class-name/component-class-name.utils';
import { readProjectStyle } from '../../../utils/style/style';
import type { Style } from '../../../types/style.type';

/**
 * Scaffolds a new Xaendar component inside a dedicated folder.
 *
 * Creates the directory `<path>/<name>/` and writes the following files:
 * - `<name>.xd.component.ts`      — class decorated with `@WebComponent`
 * - `<name>.xd.component.html`    — minimal template
 * - `<name>.xd.component.<style>` — empty stylesheet (`.css`, `.scss`, `.sass` or `.less`)
 * - `<name>.xd.component.spec.ts` — Vitest skeleton
 *
 * Exits the process with code `1` if the target directory already exists
 * and `force` is not set.
 *
 * @param name - The component name in any casing (`my-button`, `myButton`,
 *   `my_button`). Used as-is for filenames; converted to PascalCase for the
 *   class name and to kebab-case for the selector.
 * @param path - The base directory where the component folder will be created.
 *   Defaults to the current working directory.
 * @param force - When `true`, deletes an existing directory with the same name
 *   before generating the new component.
 * @param style - The stylesheet format, which is the extension of the stylesheet. Defaults to the one
 *   of the project (`generate.components.style` in the nearest `xaendar.json`), or `css` without one.
 */
export function generateComponent(name: string, path: string, force?: boolean, style?: Style): void {
  if (!isValidCustomElementName(name)) {
    process.exit(1);
  }

  const dir = join(path, name);
  style ??= readProjectStyle(path);

  if (existsSync(dir)) {
    if (force) {
      console.log(`Deleting "${name}"...`);
      rmSync(dir, { recursive: true, force: true });
      console.log('✔  Component Deleted.')
    } else {
      console.error(`✖  Directory "${name}" already exists.`);
      process.exit(1);
    }
  }

  mkdirSync(dir, { recursive: true });

  const files: [string, string][] = [
    [`${name}.xd.component.ts`, tsTemplate(name, style)],
    [`${name}.xd.component.html`, htmlTemplate(name)],
    [`${name}.xd.component.${style}`, cssTemplate(name)],
    [`${name}.xd.component.spec.ts`, specTemplate(name)],
  ];

  for (let i = 0; i < files.length; i++) {
    const [filename, content] = files[i];
    writeFileSync(join(dir, filename), content, 'utf8');
  }

  console.log();
  console.log(`✔  Component "${name}" generated`);
}

/**
 * Generates the TypeScript source file content for a component.
 *
 * @param name - The component name used to derive the class name, selector,
 *   and asset paths.
 * @returns A string containing the full TypeScript source.
 */
function tsTemplate(name: string, style: string): string {
  const className = toComponentClassName(name);
  return `import { CustomElement, WebComponent } from '@xaendar/core';

@WebComponent({
  selector: '${name}',
  styleUrl: './${name}.xd.component.${style}',
  templateUrl: './${name}.xd.component.html'
})
export class ${className} extends CustomElement {

}`;
}

/**
 * Generates the HTML template file content for a component.
 *
 * @param name - The component name shown in the placeholder paragraph.
 * @returns A string containing the minimal HTML template.
 */
function htmlTemplate(name: string): string {
  return `<p>${name} works!</p>\n`;
}

/**
 * Generates the CSS stylesheet file content for a component.
 *
 * @param _name - The component name (unused; kept for signature consistency).
 * @returns A string containing an empty stylesheet with a placeholder comment.
 */
function cssTemplate(_name: string): string {
  return '/* component styles */\n';
}

/**
 * Generates the Vitest spec file content for a component.
 *
 * The spec mounts the component as `index.html` does, by adding its tag to the document, and checks that
 * it renders the placeholder of its template.
 *
 * @param name - The component name used to derive the class name, the selector and the import
 *   path.
 * @returns A string containing a minimal `describe` / `it` test skeleton.
 */
function specTemplate(name: string): string {
  const className = toComponentClassName(name);
  return `import { describe, expect, it } from 'vitest';
import { ${className} } from './${name}.xd.component';

describe('${className}', () => {
  it('renders its template', () => {
    const element = document.createElement('${name}');
    document.body.append(element);

    expect(element).toBeInstanceOf(${className});
    expect(element.shadowRoot?.textContent).toContain('${name} works!');
    element.remove();
  });
});
`;
}