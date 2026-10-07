import { computed } from '@xaendar/core/signals';
import type { Computed } from '@xaendar/core/signals';
import { lang } from '../router/router';
import { MESSAGES } from './messages';
import type { Messages } from './messages';

/**
 * The texts of the user interface in the current language.
 *
 * Components expose it as a member annotated with its signal type
 * (`readonly t: Computed<Messages> = t;`): the template compiler recognizes signal members
 * syntactically, so the annotation is what makes attribute bindings reading it reactive.
 */
export const t: Computed<Messages> = computed(() => MESSAGES[lang()]);
