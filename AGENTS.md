# AGENTS.md — Monorepo Librerie Client (Xaendar)

## Cos'è questo repo

Xaendar è un framework per costruire Web Components in modo dichiarativo, usando un template che estende HTML5.
Il repository è un monorepo con le librerie principali sotto la cartella /packages.

---

## Struttura del monorepo

```
.
├── packages/                 ← librerie del monorepo
│   ├── build-tools/          ← strumenti di build e utility condivise
│   ├── cli/                 ← CLI del framework
│   ├── common/              ← utilità condivise e modelli comuni
│   ├── compiler/            ← compiler/parser/generator del template
│   ├── core/                ← runtime del framework e decorators/directives
│   ├── language-core/       ← layer di base del linguaggio
│   ├── language-server/     ← language server / supporto editor
│   ├── signals/             ← sistema di signals
│   ├── types/               ← tipi pubblici del framework
│   ├── vscode-client/       ← estensione VS Code / client editor
│   └── ...
├── schematics/              ← script e utilities di build/deploy del monorepo
├── src/                     ← app/demo shell principale
├── output/                  ← build output generato
├── docs/                    ← documentazione, guide e stories
│   ├── apis/                ← API docs generate
│   ├── Form Designer/       ← documentazione form designer
│   ├── i18n/                ← documentazione internazionalizzazione
│   └── stories/             ← Storybook stories
├── .storybook/              ← configurazione Storybook
├── e2e/                     ← test end-to-end
├── tasks/                   ← script di build e automazione
├── README.md
├── package.json
├── tsconfig.json
├── tsconfig.typecheck.json
├── vite.config.ts
├── vite-config.ts
├── eslint.config.mjs
├── roadmap.txt
└── src/test.ts
```

---

## Convenzioni

- **Linguaggio:** TypeScript strict
- **Test:** Vitest
- **Componenti documentati con:** Storybook (`.storybook/`, stories in `docs/stories/`)
- **API docs:** in `docs/apis/`

---