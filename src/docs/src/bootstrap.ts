import { startI18n } from './core/i18n/i18n';
import { loadInitialPage } from './core/pages/pages';

/*
  Only the shell is imported here: the template of each component imports the components and directives it
  uses, and the outlet loads each page on demand, so a page is defined, with everything it needs, before it is
  rendered. The components the server rendered hydrate as soon as they are defined, so the texts of the current
  language and the module of the first page are loaded before the shell: the outlet then adopts the page the server
  rendered, instead of its @default.
*/
await Promise.all([startI18n(), loadInitialPage()]);
await import('./shell/docs-app/docs-app.xd.component');
