/*
  Registers every component and directive of the site before anything is rendered: a component
  used by a template that was already rendered would receive its bindings as plain attributes.
  The root element is only added once every definition is in place. The *.lazy.xd.component.ts files are
  left out on purpose: the examples about lazy loading import them on demand.
*/
import.meta.glob(['./**/*.xd.component.ts', './**/*.directive.ts', '!./**/*.lazy.xd.component.ts', '!./snippets/**'], { eager: true });

document.body.append(document.createElement('docs-app'));
