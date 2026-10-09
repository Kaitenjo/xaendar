import type { Messages } from '../i18n/i18n';

/**
 * The path of a page listed in the navigation, e.g. `signals/computed`: the key of its title
 * in the `nav.pages` texts.
 */
export type PagePath = keyof Messages['nav']['pages'];

/**
 * A page of the documentation.
 */
export type DocsPage = {
  /**
   * The path of the page, `''` for the home page.
   */
  readonly path: PagePath | '';
  /**
   * Extra words the page is found by when searching.
   */
  readonly keywords?: string;
};

/**
 * An entry of a navigation section: a link to a page, or a collapsible group of pages.
 */
export type NavItem = {
  /**
   * The page the entry links to; the entry is labelled with its title.
   */
  readonly page: DocsPage;
  /**
   * Missing for links.
   */
  readonly group?: undefined;
  /**
   * Missing for links.
   */
  readonly pages?: undefined;
} | {
  /**
   * The key of the label of the group in the `nav.groups` texts.
   */
  readonly group: keyof Messages['nav']['groups'];
  /**
   * The pages of the group.
   */
  readonly pages: readonly DocsPage[];
  /**
   * Missing for groups.
   */
  readonly page?: undefined;
};

/**
 * A titled section of the navigation.
 */
export type NavSection = {
  /**
   * The key of the title of the section in the `nav.sections` texts.
   */
  readonly key: keyof Messages['nav']['sections'];
  /**
   * The entries of the section, in order.
   */
  readonly items: readonly NavItem[];
};

/**
 * Creates a page.
 *
 * @param path - The path of the page.
 * @param keywords - Extra words the page is found by when searching.
 * @returns The page.
 */
function page(path: PagePath | '', keywords?: string): DocsPage {
  return { path, keywords };
}

/**
 * Creates a link entry.
 *
 * @param target - The page the entry links to.
 * @returns The entry, labelled with the title of the page.
 */
function link(target: DocsPage): NavItem {
  return { page: target };
}

/**
 * Creates a group entry.
 *
 * @param key - The key of the label of the group.
 * @param pages - The pages of the group.
 * @returns The entry.
 */
function group(key: keyof Messages['nav']['groups'], pages: readonly DocsPage[]): NavItem {
  return { group: key, pages };
}

/**
 * Reads the title of a page.
 *
 * @param target - The page.
 * @param messages - The texts of the language to read it in.
 * @returns The title, shown in the navigation, in the pager and in search results.
 */
export function pageTitle(target: DocsPage, messages: Messages): string {
  return target.path ? messages.nav.pages[target.path] : messages.nav.home;
}

/**
 * Reads the label of a navigation entry.
 *
 * @param item - The entry.
 * @param messages - The texts of the language to read it in.
 * @returns The title of the page of a link, or the label of a group.
 */
export function itemTitle(item: NavItem, messages: Messages): string {
  return item.page ? pageTitle(item.page, messages) : messages.nav.groups[item.group];
}

/**
 * The home page, reached from the logo: it is not listed in the navigation.
 */
export const HOME_PAGE = page('');

/**
 * The navigation of the documentation, modeled on the one of angular.dev.
 */
export const NAV: readonly NavSection[] = [
  {
    key: 'introduction',
    items: [
      link(page('overview', 'introduction granular reactivity virtual dom')),
      link(page('installation', 'setup install loadSignals tsconfig babel decorators vite')),
      group('essentials', [
        page('essentials/components', 'WebComponent CustomElement'),
        page('essentials/signals', 'signal computed effect'),
        page('essentials/templates', 'interpolation binding events if for'),
        page('essentials/next-steps')
      ]),
      link(page('tutorial', 'tutorial todo list step'))
    ]
  },
  {
    key: 'inDepthGuides',
    items: [
      group('signals', [
        page('signals/overview', 'signal set update get equals'),
        page('signals/computed', 'computed derived lazy cache diamond circular'),
        page('signals/effects', 'effect batching microtask dispose onCleanup onBeforeRun onAfterRun'),
        page('signals/untracked', 'untracked'),
        page('signals/options', 'equals watched unwatched frozen'),
        page('signals/advanced', 'watcher introspect subtle tc39 devMode'),
        page('signals/shared-state', 'store service module singleton dependency injection')
      ]),
      group('components', [
        page('components/anatomy', 'WebComponent CustomElement templateUrl styleUrl'),
        page('components/registration', 'selector customElements define import order'),
        page('components/styling', 'css shadow dom host slotted part custom properties'),
        page('components/inputs', 'Property input alias transform required InputSignal'),
        page('components/outputs', 'Event output emit CustomEvent detail bubbles composed'),
        page('components/lifecycle', 'onInit afterRender onDestroy connectedCallback'),
        page('components/content-projection', 'slot ng-content fallback named'),
        page('components/queries', 'Query viewChild querySelector'),
        page('components/content-queries', 'Query.content contentChild slots lightDom'),
        page('components/dom-apis', 'afterRender canvas focus ResizeObserver'),
        page('components/inheritance', 'extends base class subclass')
      ]),
      group('templates', [
        page('templates/overview', 'whitespace self-closing comments special characters escape'),
        page('templates/text-interpolation', 'interpolation braces'),
        page('templates/binding', 'binding attribute property class style'),
        page('templates/events', 'event click $event handler'),
        page('templates/if', 'if else conditional'),
        page('templates/for', 'for track $index $first $last $even $odd loop'),
        page('templates/switch', 'switch case default'),
        page('templates/conditional-bindings', 'conditional binding attribute if switch tag'),
        page('templates/expressions', 'expression allowed forbidden globals'),
        page('templates/imports', 'import'),
        page('templates/svg-mathml', 'svg mathml namespace chart')
      ]),
      group('directives', [
        page('directives/overview', 'Directive selector registry'),
        page('directives/custom', 'CustomDirective attribute directive @@'),
        page('directives/structural', 'StructuralDirective shouldRender async *'),
        page('directives/conditional', 'conditional directive if switch')
      ]),
      group('patterns', [
        page('patterns/forms', 'form input checkbox select validation two-way'),
        page('patterns/async-data', 'fetch loading error abort race'),
        page('patterns/routing', 'router hash navigation'),
        page('patterns/html-rendering', 'innerHTML markdown sanitize'),
        page('patterns/theming', 'theme dark light css variables'),
        page('patterns/lists', 'table crud add remove')
      ])
    ]
  },
  {
    key: 'developerTools',
    items: [
      link(page('tools/cli', 'xd new start build generate')),
      link(page('tools/build', 'vite plugin xaendarPlugin babel hmr')),
      link(page('tools/language-service', 'vscode extension language server diagnostics'))
    ]
  },
  {
    key: 'reference',
    items: [
      link(page('reference/api', 'api exports')),
      link(page('reference/template-syntax', 'cheat sheet syntax')),
      link(page('reference/errors', 'error message lexer parser type checker runtime')),
      link(page('reference/known-issues', 'bug issue limitation')),
      link(page('reference/coming-from-angular', 'angular migration comparison'))
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
 * Searches the pages whose title, path or keywords contain every word of a query.
 *
 * @param query - The words to search, in any order.
 * @param messages - The texts of the language the titles are searched in; title matches rank first.
 * @param limit - The maximum number of results.
 * @returns The matching pages, best matches first.
 */
export function searchPages(query: string, messages: Messages, limit = 8): DocsPage[] {
  const words = query.toLowerCase().split(/\s+/).filter(word => word.length > 0);
  if (!words.length) {
    return [];
  }

  const scored = PAGES.map(candidate => {
    const title = pageTitle(candidate, messages).toLowerCase();
    const haystack = `${title} ${candidate.path} ${candidate.keywords ?? ''}`.toLowerCase();
    if (!words.every(word => haystack.includes(word))) {
      return { candidate, score: -1 };
    }

    return { candidate, score: words.filter(word => title.includes(word)).length * 2 + (title.startsWith(words[0]!) ? 1 : 0) };
  });

  return scored.filter(({ score }) => score >= 0).sort((left, right) => right.score - left.score).slice(0, limit).map(({ candidate }) => candidate);
}
