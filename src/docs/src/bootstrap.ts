import './shell/docs-app/docs-app.xd.component';
import { startI18n } from './core/i18n/i18n';

/*
  Only the shell is imported here: the template of each component imports the components and directives it
  uses, and the outlet loads each page on demand, so a page is defined, with everything it needs, before it is
  rendered. The root element is only added once the texts of the current language are loaded.
*/
startI18n().then(() => document.body.append(document.createElement('docs-app')));
