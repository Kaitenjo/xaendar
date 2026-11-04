import type { SourceFile } from '../../../core/sources/source-files.utils';

/**
 * The snippet `bootstrap.ts`, shown by the page components/registration.
 */
export const COMPONENTS_BOOTSTRAP: SourceFile = {
  name: 'bootstrap.ts',
  lang: 'ts',
  code: `// Imports the root component: its template imports the components and directives it uses, and theirs do the same,
// so each one is defined before the template using it is rendered
import './my-app-root/my-app-root.xd.component';

document.body.append(document.createElement('my-app-root'));`
};
