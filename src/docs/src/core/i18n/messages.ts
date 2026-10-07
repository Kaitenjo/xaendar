import type { Lang } from '../router/route-hash.utils';

/**
 * The English texts of the user interface. Their shape defines the {@link Messages} every
 * language must provide.
 */
const EN = {
  brand: {
    tagline: 'Web Components with fine-grained reactivity',
    home: 'Xaendar home'
  },
  search: {
    placeholder: 'Search the docs',
    noResults: 'No pages found',
    label: 'Search'
  },
  topbar: {
    menu: 'Toggle navigation',
    theme: 'Toggle light/dark theme',
    language: 'Language'
  },
  example: {
    result: 'Result',
    showCode: 'Show code',
    hideCode: 'Hide code',
    edge: 'Edge case',
    files: 'Source files'
  },
  code: {
    copy: 'Copy',
    copied: 'Copied!',
    error: 'Compiler output',
    bad: 'Does not work',
    good: 'Works'
  },
  callout: {
    note: 'Note',
    tip: 'Tip',
    warning: 'Warning',
    edge: 'Edge case',
    unsupported: 'Not supported',
    issue: 'Known issue'
  },
  pager: {
    previous: 'Previous',
    next: 'Next'
  }
};

/**
 * The texts of the user interface.
 */
export type Messages = typeof EN;

/**
 * The Italian texts of the user interface.
 */
const IT: Messages = {
  brand: {
    tagline: 'Web Component con reattività a grana fine',
    home: 'Home di Xaendar'
  },
  search: {
    placeholder: 'Cerca nella documentazione',
    noResults: 'Nessuna pagina trovata',
    label: 'Cerca'
  },
  topbar: {
    menu: 'Apri/chiudi la navigazione',
    theme: 'Cambia tema chiaro/scuro',
    language: 'Lingua'
  },
  example: {
    result: 'Risultato',
    showCode: 'Mostra codice',
    hideCode: 'Nascondi codice',
    edge: 'Caso limite',
    files: 'File sorgente'
  },
  code: {
    copy: 'Copia',
    copied: 'Copiato!',
    error: 'Output del compilatore',
    bad: 'Non funziona',
    good: 'Funziona'
  },
  callout: {
    note: 'Nota',
    tip: 'Suggerimento',
    warning: 'Attenzione',
    edge: 'Caso limite',
    unsupported: 'Non supportato',
    issue: 'Problema noto'
  },
  pager: {
    previous: 'Precedente',
    next: 'Successiva'
  }
};

/**
 * The texts of the user interface, by language.
 */
export const MESSAGES: Readonly<Record<Lang, Messages>> = { en: EN, it: IT };
