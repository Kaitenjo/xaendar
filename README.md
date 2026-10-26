# Xaendar

**Declarative Web Components with fine-grained reactivity decided at build time.**

Xaendar is a TypeScript framework for building native Web Components. A component is a class plus a template written in an extended HTML5 syntax. The compiler analyses each template statically and wires every element, attribute and text node to the exact signals it reads. There is no virtual DOM and no component re-render: when a signal changes, only the nodes that depend on it are updated.

## Highlights

- **Real custom elements.** Every component extends `HTMLElement`, renders into its own shadow root and works anywhere: with any other framework, or with none.
- **No virtual DOM.** Templates compile to imperative code that creates the DOM once and updates single nodes afterwards.
- **Signals.** State is held in signals based on the [TC39 Signals proposal](https://github.com/tc39/proposal-signals), with `computed` values and `effect`s disposed with the component.
- **Type-checked templates.** Bindings, events, `$event` and the inputs of child components are checked against the component class at build time.
- **Familiar decorators.** `@WebComponent`, `@Property` for inputs, `@Event` for outputs, `@Query` for the elements of the shadow DOM and of the projected content, `@HostProperty` and `@HostEvent` for the host element.
- **Directives.** Attribute directives (`@@name`) add behavior to an element, structural directives (`*name`) decide whether it exists.
- **Tooling included.** A Vite plugin, a CLI that scaffolds, serves, builds and tests projects, a language server with a VS Code extension, and Sass and Less support.

## A quick look

```ts
// counter.xd.component.ts
import { CustomElement, Event, Output, Property, WebComponent } from '@xaendar/core';
import { signal, type InputSignal } from '@xaendar/core/signals';

@WebComponent({
  selector: 'my-counter',
  styleUrl: './counter.xd.component.css',
  templateUrl: './counter.xd.component.html'
})
export class CounterComponent extends CustomElement {
  @Property(1)
  public accessor step!: InputSignal<number>;

  @Event()
  public accessor changed!: Output<number>;

  public readonly count = signal(0);

  public increment(): void {
    this.count.update(count => count + this.step());
    this.changed.emit(this.count());
  }
}
```

```html
<!-- counter.xd.component.html -->
<p [class.even]="{count() % 2 === 0}">You clicked { count() } times.</p>
<button (click)="increment()">Add { step() }</button>

@if (count() >= 10) {
  <p>That's a lot of clicks.</p>
}
```

A parent template imports the component and uses it like any other element:

```html
@import { CounterComponent } from './counter/counter.xd.component';

<my-counter step="{ 2 }" (changed)="log($event.detail)" />
```

When `count` changes, the runtime updates the text node of the first paragraph, its `even` class and the `@if` block, and nothing else.

## Getting started

```bash
# Install the CLI once, globally (or use it through npx)
npm install --global @xaendar/cli

# Scaffold a project: it asks for the stylesheet format (CSS, SCSS, Sass or Less)
xd new my-app

# Start the dev server on http://localhost:4200
cd my-app
npm start
```

| Command | What it does |
| --- | --- |
| `xd new <name>` | Scaffolds a project and installs its dependencies |
| `xd generate component <selector>` (`xd g c`) | Generates a component: class, template, stylesheet and spec |
| `xd start` | Starts the Vite dev server |
| `xd build` | Type-checks the templates and builds the project for production |
| `xd test` | Runs the specs of the project with Vitest |

## Packages

| Package | Description |
| --- | --- |
| [`@xaendar/core`](packages/core) | Runtime: `CustomElement`, the decorators, directives, queries and the template runtime. The signals live in `@xaendar/core/signals` |
| [`@xaendar/signals`](packages/signals) | Signal polyfill based on the TC39 proposal, installed with `loadSignals()` |
| [`@xaendar/compiler`](packages/compiler) | Template lexer, parser, type-checker and code generator |
| [`@xaendar/build-tools`](packages/build-tools) | Vite plugin that compiles templates and stylesheets and type-checks the project |
| [`@xaendar/cli`](packages/cli) | The `xd` command line interface |
| [`@xaendar/language-core`](packages/language-core) | Language service features: diagnostics, completions, hover, go to definition, semantic tokens |
| [`@xaendar/language-server`](packages/language-server) | LSP server for `.xd.component.html` templates |
| [`@xaendar/vscode-client`](packages/vscode-client) | VS Code extension that runs the language server |
| [`@xaendar/common`](packages/common), [`@xaendar/types`](packages/types) | Shared models, utilities and TypeScript types |

A [Claude Code plugin](plugins/xaendar) with a Xaendar skill, commands and a reviewer agent is also available.

## Documentation

The documentation site is written in Xaendar itself and lives in [`src/docs`](src/docs). It is bilingual (English and Italian) and covers components, templates, signals, directives, patterns, the API reference, the error messages and the known issues, with live examples shown next to their source.

It is a separate npm project, run by the `xd` CLI built from the sources of this repository. To run it locally:

```bash
npm install                     # the dependencies of the monorepo
npm install --prefix src/docs   # the dependencies of the site
(cd packages/cli && npm link)   # makes the xd command run the CLI from the sources
npm start                       # http://localhost:4200
```

## Development

This is a monorepo: each package is published separately as `@xaendar/<name>`, and builds and releases are driven from [`schematics/`](schematics).

```bash
npm install
npm test                    # all the specs, with Vitest
npm run test:coverage       # 100% coverage is enforced
npm run lint
npm run build:projects      # builds every package into dist/@xaendar/<name>
npm run typecheck:projects
```

Read [`CLAUDE.md`](CLAUDE.md) for the architecture, and the files in [`.claude/rules`](.claude/rules) for the code style.

## License

ISC
