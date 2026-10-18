// Imports the root component: its template imports the components and directives it uses, and theirs do the same,
// so each one is defined before the template using it is rendered
import './my-app-root/my-app-root.xd.component';

document.body.append(document.createElement('my-app-root'));
