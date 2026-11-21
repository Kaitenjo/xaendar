import { loadMessages, startI18n } from './core/i18n/i18n';
import { loadInitialPage, loadPage } from './core/pages/pages';
import { followLocation, locationRoute } from './core/router/router';

/*
  Only the shell is imported here: the template of each component imports the components and directives it
  uses, and the outlet loads each page on demand, so a page is defined, with everything it needs, before it is
  rendered. The components the server rendered hydrate as soon as they are defined, so the texts of the current
  language and the module of the first page are loaded before the shell: the outlet then adopts the page the server
  rendered, instead of its @default.

  The server never sees the hash of the URL, so it renders the home page in English: the shell hydrates with that
  route, adopting every block the server rendered, and only then the router follows the location. The page and the
  texts of the location are loaded meanwhile, so that the outlet displays them at once.
*/
const { lang, path } = locationRoute();
await Promise.all([startI18n(), loadInitialPage(), loadPage(path), loadMessages(lang)]);
await import('./shell/docs-app/docs-app.xd.component');
followLocation();
