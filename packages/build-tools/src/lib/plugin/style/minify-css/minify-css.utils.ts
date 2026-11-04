import { transform } from 'lightningcss';

/**
 * Minifies a CSS text with Lightning CSS, the same minifier Vite uses for the CSS it bundles.
 *
 * @param css - The CSS to minify.
 * @param filename - Path of the stylesheet, reported by Lightning CSS in its error messages.
 * @returns The minified CSS.
 * @throws If the CSS cannot be parsed.
 */
export function minifyCss(css: string, filename: string): string {
  return transform({ filename, code: Buffer.from(css), minify: true }).code.toString();
}
