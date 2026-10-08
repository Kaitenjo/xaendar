import type { Lang, Localized } from '../router/route-hash.utils';

/**
 * A page of the documentation.
 */
export type DocsPage = {
  /**
   * The path of the page, e.g. `signals/computed`.
   */
  readonly path: string;
  /**
   * The title of the page, shown in the navigation and in search results.
   */
  readonly title: Localized;
  /**
   * Extra words the page is found by when searching, in any language.
   */
  readonly keywords?: string;
};

/**
 * An entry of a navigation section: a link to a page, or a collapsible group of pages.
 */
export type NavItem = {
  /**
   * The label of the entry.
   */
  readonly title: Localized;
  /**
   * The page the entry links to. Missing for groups.
   */
  readonly page?: DocsPage;
  /**
   * The pages of a group. Missing for links.
   */
  readonly pages?: readonly DocsPage[];
};

/**
 * A titled section of the navigation.
 */
export type NavSection = {
  /**
   * The title of the section.
   */
  readonly title: Localized;
  /**
   * The entries of the section, in order.
   */
  readonly items: readonly NavItem[];
};

/**
 * Creates a page.
 *
 * @param path - The path of the page.
 * @param en - The English title.
 * @param it - The Italian title.
 * @param keywords - Extra words the page is found by when searching.
 * @returns The page.
 */
function page(path: string, en: string, it: string, keywords?: string): DocsPage {
  return { path, title: { en, it }, keywords };
}

/**
 * Creates a link entry.
 *
 * @param target - The page the entry links to.
 * @returns The entry, labelled with the title of the page.
 */
function link(target: DocsPage): NavItem {
  return { title: target.title, page: target };
}

/**
 * Creates a group entry.
 *
 * @param en - The English label.
 * @param it - The Italian label.
 * @param pages - The pages of the group.
 * @returns The entry.
 */
function group(en: string, it: string, pages: readonly DocsPage[]): NavItem {
  return { title: { en, it }, pages };
}

/**
 * The home page, reached from the logo: it is not listed in the navigation.
 */
export const HOME_PAGE = page('', 'Home', 'Home');

/**
 * The navigation of the documentation, modeled on the one of angular.dev.
 */
export const NAV: readonly NavSection[] = [
  {
    title: { en: 'Introduction', it: 'Introduzione' },
    items: [
      link(page('overview', 'What is Xaendar?', 'Cos’è Xaendar?', 'introduction granular reactivity virtual dom')),
      link(page('installation', 'Installation', 'Installazione', 'setup install loadSignals tsconfig babel decorators vite')),
      group('Essentials', 'Fondamenti', [
        page('essentials/components', 'Components', 'Componenti', 'WebComponent CustomElement'),
        page('essentials/signals', 'Reactivity with signals', 'Reattività con i signal', 'signal computed effect'),
        page('essentials/templates', 'Dynamic templates', 'Template dinamici', 'interpolation binding events if for'),
        page('essentials/next-steps', 'Next steps', 'Prossimi passi')
      ]),
      link(page('tutorial', 'Tutorial: a todo app', 'Tutorial: una todo app', 'tutorial todo list step'))
    ]
  },
  {
    title: { en: 'In-depth guides', it: 'Guide approfondite' },
    items: [
      group('Signals', 'Signal', [
        page('signals/overview', 'Overview', 'Panoramica', 'signal set update get equals'),
        page('signals/computed', 'Computed signals', 'Signal derivati (computed)', 'computed derived lazy cache diamond circular'),
        page('signals/effects', 'Effects', 'Effetti', 'effect batching microtask dispose onCleanup onBeforeRun onAfterRun'),
        page('signals/untracked', 'Reading without tracking', 'Lettura senza tracciamento', 'untracked'),
        page('signals/options', 'Signal options', 'Opzioni dei signal', 'equals watched unwatched frozen'),
        page('signals/advanced', 'Advanced: Signal.subtle', 'Avanzato: Signal.subtle', 'watcher introspect subtle tc39 devMode'),
        page('signals/shared-state', 'Sharing state', 'Stato condiviso', 'store service module singleton dependency injection')
      ]),
      group('Components', 'Componenti', [
        page('components/anatomy', 'Anatomy of a component', 'Anatomia di un componente', 'WebComponent CustomElement templateUrl styleUrl'),
        page('components/registration', 'Selectors and registration', 'Selettori e registrazione', 'selector customElements define import order'),
        page('components/styling', 'Styling', 'Stili', 'css shadow dom host slotted part custom properties'),
        page('components/inputs', 'Inputs with @Property', 'Input con @Property', 'Property input alias transform required InputSignal'),
        page('components/outputs', 'Outputs with @Event', 'Output con @Event', 'Event output emit CustomEvent detail bubbles composed'),
        page('components/lifecycle', 'Lifecycle', 'Ciclo di vita', 'onInit afterRender onDestroy connectedCallback'),
        page('components/content-projection', 'Content projection with slots', 'Proiezione di contenuto con gli slot', 'slot ng-content fallback named'),
        page('components/queries', 'View queries', 'Query sulla vista', 'Query viewChild querySelector'),
        page('components/content-queries', 'Content queries', 'Query sul contenuto', 'Query.content contentChild slots lightDom'),
        page('components/dom-apis', 'Using DOM APIs', 'Usare le API del DOM', 'afterRender canvas focus ResizeObserver'),
        page('components/inheritance', 'Inheritance', 'Ereditarietà', 'extends base class subclass')
      ]),
      group('Templates', 'Template', [
        page('templates/overview', 'Template syntax', 'Sintassi dei template', 'whitespace self-closing comments special characters escape'),
        page('templates/text-interpolation', 'Text interpolation', 'Interpolazione del testo', 'interpolation braces'),
        page('templates/binding', 'Attribute and property binding', 'Binding di attributi e proprietà', 'binding attribute property class style'),
        page('templates/events', 'Event listeners', 'Gestione degli eventi', 'event click $event handler'),
        page('templates/if', 'Conditionals with @if', 'Condizioni con @if', 'if else conditional'),
        page('templates/for', 'Lists with @for', 'Liste con @for', 'for track $index $first $last $even $odd loop'),
        page('templates/switch', 'Branching with @switch', 'Diramazioni con @switch', 'switch case default'),
        page('templates/conditional-bindings', 'Conditional bindings', 'Binding condizionali', 'conditional binding attribute if switch tag'),
        page('templates/expressions', 'Expression syntax', 'Sintassi delle espressioni', 'expression allowed forbidden globals'),
        page('templates/imports', 'Importing components', 'Importare componenti', 'import'),
        page('templates/svg-mathml', 'SVG and MathML', 'SVG e MathML', 'svg mathml namespace chart')
      ]),
      group('Directives', 'Direttive', [
        page('directives/overview', 'Overview', 'Panoramica', 'Directive selector registry'),
        page('directives/custom', 'Custom directives', 'Direttive custom', 'CustomDirective attribute directive @@'),
        page('directives/structural', 'Structural directives', 'Direttive strutturali', 'StructuralDirective shouldRender async *'),
        page('directives/conditional', 'Conditional directives', 'Direttive condizionali', 'conditional directive if switch')
      ]),
      group('Patterns', 'Pattern', [
        page('patterns/forms', 'Forms', 'Form', 'form input checkbox select validation two-way'),
        page('patterns/async-data', 'Async data', 'Dati asincroni', 'fetch loading error abort race'),
        page('patterns/routing', 'Routing', 'Routing', 'router hash navigation'),
        page('patterns/html-rendering', 'Rendering HTML', 'Renderizzare HTML', 'innerHTML markdown sanitize'),
        page('patterns/theming', 'Theming', 'Temi', 'theme dark light css variables'),
        page('patterns/lists', 'Lists and CRUD', 'Liste e CRUD', 'table crud add remove')
      ])
    ]
  },
  {
    title: { en: 'Developer tools', it: 'Strumenti' },
    items: [
      link(page('tools/cli', 'CLI', 'CLI', 'xd new start build generate')),
      link(page('tools/build', 'Build and Vite plugin', 'Build e plugin Vite', 'vite plugin xaendarPlugin babel hmr')),
      link(page('tools/language-service', 'Language service and VS Code', 'Language service e VS Code', 'vscode extension language server diagnostics'))
    ]
  },
  {
    title: { en: 'Reference', it: 'Riferimento' },
    items: [
      link(page('reference/api', 'API reference', 'Riferimento API', 'api exports')),
      link(page('reference/template-syntax', 'Template syntax cheat sheet', 'Prontuario della sintassi', 'cheat sheet syntax')),
      link(page('reference/errors', 'Error encyclopedia', 'Enciclopedia degli errori', 'error message lexer parser type checker runtime')),
      link(page('reference/known-issues', 'Known issues', 'Problemi noti', 'bug issue limitation')),
      link(page('reference/coming-from-angular', 'Coming from Angular', 'Arrivando da Angular', 'angular migration comparison'))
    ]
  }
];

/**
 * Every page listed in the navigation, in reading order.
 */
export const PAGES: readonly DocsPage[] = NAV.flatMap(section => section.items.flatMap(item => item.page ? [item.page] : item.pages ?? []));

/**
 * Finds a page by its path.
 *
 * @param path - The path of the page.
 * @returns The page, the home page for `''`, or `undefined` if no page has that path.
 */
export function findPage(path: string): DocsPage | undefined {
  return path === '' ? HOME_PAGE : PAGES.find(candidate => candidate.path === path);
}

/**
 * Finds the pages before and after a page, in reading order.
 *
 * @param path - The path of the page.
 * @returns The previous and the next page, `undefined` at the edges or for unknown pages.
 */
export function findNeighbours(path: string): { previous: DocsPage | undefined; next: DocsPage | undefined } {
  if (path === '') {
    return { previous: undefined, next: PAGES[0] };
  }

  const index = PAGES.findIndex(candidate => candidate.path === path);
  if (index < 0) {
    return { previous: undefined, next: undefined };
  }

  return { previous: index === 0 ? HOME_PAGE : PAGES[index - 1], next: PAGES[index + 1] };
}

/**
 * Searches the pages whose title (in any language), path or keywords contain every word of a query.
 *
 * @param query - The words to search, in any order.
 * @param lang - The language whose title matches rank first.
 * @param limit - The maximum number of results.
 * @returns The matching pages, best matches first.
 */
export function searchPages(query: string, lang: Lang, limit = 8): DocsPage[] {
  const words = query.toLowerCase().split(/\s+/).filter(word => word.length > 0);
  if (!words.length) {
    return [];
  }

  const scored = PAGES.map(candidate => {
    const title = candidate.title[lang].toLowerCase();
    const haystack = `${candidate.title.en} ${candidate.title.it} ${candidate.path} ${candidate.keywords ?? ''}`.toLowerCase();
    if (!words.every(word => haystack.includes(word))) {
      return { candidate, score: -1 };
    }

    return { candidate, score: words.filter(word => title.includes(word)).length * 2 + (title.startsWith(words[0]!) ? 1 : 0) };
  });

  return scored.filter(({ score }) => score >= 0).sort((a, b) => b.score - a.score).slice(0, limit).map(({ candidate }) => candidate);
}
