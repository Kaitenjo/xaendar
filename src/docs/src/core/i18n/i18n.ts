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
 * Where the texts of each language are fetched from: Vite emits the files as assets.
 */
const SOURCES: Readonly<Record<Lang, URL>> = {
  en: new URL('../../i18n/en.json', import.meta.url),
  it: new URL('../../i18n/it.json', import.meta.url)
};

/**
 * The requests made so far, by language: each file is fetched once.
 */
const requests = new Map<Lang, Promise<Messages>>();

/**
 * The texts of the language loaded last.
 */
const loaded = signal<Messages | undefined>(undefined);

/**
 * The texts of the documentation in the current language.
 *
 * Components expose it as a member (`readonly t = t;`): the template compiler follows the
 * member to this declaration, so attribute bindings reading it are reactive.
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
 * Fetches the texts of a language, once.
 *
 * @param target - The language to load.
 * @returns The texts of the language.
 */
export function loadMessages(target: Lang): Promise<Messages> {
  let request = requests.get(target);
  if (!request) {
    request = fetch(SOURCES[target])
      .then<Messages>(response => {
        if (!response.ok) {
          throw new Error(`Unable to load the texts of "${target}": ${response.status} ${response.statusText}`);
        }
        return response.json();
      })
      .catch((error: unknown) => {
        // A failed request is forgotten, so that the next switch to the language tries again
        requests.delete(target);
        throw error;
      });
    requests.set(target, request);
  }
  return request;
}

/**
 * Loads the texts of the current language, then keeps {@link translations} in the language of the route:
 * the texts of another language replace the current ones as soon as they are fetched.
 *
 * @returns A promise resolved once the texts can be read.
 */
export async function startI18n(): Promise<void> {
  loaded.set(await loadMessages(lang()));
  
  effect(() => {
    const target = lang();
    document.documentElement.lang = target;
    void loadMessages(target).then(messages => {
      // A quicker switch to another language may have happened meanwhile
      if (lang() === target) {
        loaded.set(messages);
      }
    });
  });
}
