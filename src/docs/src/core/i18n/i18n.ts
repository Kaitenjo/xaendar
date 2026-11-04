import { computed, effect, signal } from '@xaendar/core/signals';
import type en from '../../i18n/en.json';
import type { Lang } from '../router/route-hash.utils';
import { lang } from '../router/router';

/**
 * The texts of the documentation in one language. The English file defines the shape every
 * language must provide.
 */
export type Messages = typeof en;

/**
 * Loads the texts of each language: Vite emits each file as a module of its own, which the browser and the server
 * import alike, the server having no `fetch` for the files of the build.
 */
const SOURCES: Readonly<Record<Lang, () => Promise<Messages>>> = {
  en: () => import('../../i18n/en.json').then(module => module.default),
  it: () => import('../../i18n/it.json').then(module => module.default)
};

/**
 * The requests made so far, by language: each file is loaded once.
 */
const requests = new Map<Lang, Promise<Messages>>();

/**
 * The texts of the language loaded last.
 */
const loaded = signal<Messages | undefined>(undefined);

/**
 * The texts of the documentation in the current language.
 *
 * Templates import it (`@import { translations } from '…/core/i18n/i18n.ts'`): the template compiler follows the
 * import to this declaration, so attribute bindings reading it are reactive.
 *
 * @throws When read before {@link startI18n} has loaded the first language.
 */
export const translations = computed(() => {
  const messages = loaded();
  if (!messages) {
    throw new Error('The texts of the documentation are read before being loaded: await startI18n() first');
  }
  return messages;
});

/**
 * Loads the texts of a language, once.
 *
 * @param target - The language to load.
 * @returns The texts of the language.
 */
export function loadMessages(target: Lang): Promise<Messages> {
  let request = requests.get(target);
  if (!request) {
    request = SOURCES[target]().catch((error: unknown) => {
      // A failed request is forgotten, so that the next switch to the language tries again
      requests.delete(target);
      throw error;
    });
    requests.set(target, request);
  }
  return request;
}

/**
 * Loads the texts of the current language, then, in the browser, keeps {@link translations} in the language of the
 * route: the texts of another language replace the current ones as soon as they are loaded. The server renders in the
 * language it starts with, and has no document to write it on.
 *
 * @returns A promise resolved once the texts can be read.
 */
export async function startI18n(): Promise<void> {
  loaded.set(await loadMessages(lang()));
  if (!globalThis.document) {
    return;
  }

  effect(() => {
    const target = lang();
    document.documentElement.lang = target;
    loadMessages(target).then(messages => {
      // A quicker switch to another language may have happened meanwhile
      if (lang() === target) {
        loaded.set(messages);
      }
    });
  });
}
