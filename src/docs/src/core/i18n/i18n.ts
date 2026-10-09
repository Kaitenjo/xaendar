import { computed } from '@xaendar/core/signals';
import { lang } from '../router/router';
import { MESSAGES } from './messages';

/**
 * The texts of the user interface in the current language.
 *
 * Components expose it as a member (`readonly t = t;`): the template compiler follows the
 * member to this declaration, so attribute bindings reading it are reactive.
 */
export const t = computed(() => MESSAGES[lang()]);
