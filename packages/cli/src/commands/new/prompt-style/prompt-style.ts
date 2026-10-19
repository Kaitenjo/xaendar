import { createInterface } from 'node:readline/promises';
import { STYLES, type Style } from '../../../utils/style/style';

/**
 * Labels of the stylesheet formats, in the order of {@link STYLES}.
 */
const STYLE_LABELS: Record<Style, string> = {
  css: 'CSS',
  scss: 'SCSS',
  sass: 'Sass (indented syntax)',
  less: 'Less'
};

/**
 * Asks on the terminal which stylesheet format the new project uses, until a valid answer is given.
 *
 * The answer is the number of a format or its name; an empty answer picks the first one, `css`.
 *
 * @returns The chosen format.
 */
export async function promptStyle(): Promise<Style> {
  const readline = createInterface({ input: process.stdin, output: process.stdout });
  const choices = STYLES.map((style, index) => `  ${index + 1}) ${STYLE_LABELS[style]}`).join('\n');

  try {
    while (true) {
      const answer = (await readline.question(`? Which stylesheet format would you like to use?\n${choices}\nChoose [1]: `)).trim().toLowerCase();
      const style = answer ? STYLES.find((item, index) => item === answer || `${index + 1}` === answer) : 'css';
      if (style) {
        return style;
      }

      console.error(`✖  Invalid choice: ${answer}`);
    }
  } finally {
    readline.close();
  }
}
