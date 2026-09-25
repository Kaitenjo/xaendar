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

## Best practices TypeScript

- **Strict mode:** rispettare `tsconfig.json` (strict abilitato); tipizzare esplicitamente parametri e valori di ritorno delle funzioni pubbliche (`public-api.ts`).
- **Import type-only:** usare `import type { ... }` per import usati solo come tipi, per mantenere chiari i confini tra runtime e tipi (non enforced da ESLint ma da preferire).
- **Nomi file:** seguire la convenzione `*.type.ts`, `*.model.ts`, `*.utils.ts`, `*.decorator.ts`, `*.spec.ts` già presente nei `packages/*/src`.
- **Barrel file:** esporre le API pubbliche di ogni package solo tramite `src/public-api.ts`; non importare direttamente file interni di un altro package (usare gli alias `@xaendar/*` definiti in `tsconfig.json`).
- **Nessun `any` implicito:** preferire tipi precisi o `unknown` + narrowing dove il tipo non è noto a priori. Se necessario castare
  con 'as unknown as tipo-in-questione'
- **Variabili/parametri inutilizzati:** prefissare con `_` (es. `_event`) per rispettare la regola `no-unused-vars` (warning, non errore).
- **Stringhe:** usare sempre apici singoli (`'...'`), come richiesto da ESLint (`quotes: single`).
- **Null/undefined:** gestire esplicitamente i casi opzionali; `exactOptionalPropertyTypes` e `noUncheckedIndexedAccess` sono disattivati, quindi non fare affidamento sul compilatore per questi controlli — validare a runtime dove serve.
- **Side effect imports:** evitare import con soli side-effect non dichiarati esplicitamente (`noUncheckedSideEffectImports` è attivo).
- **Immutabilità:** preferire `readonly` su proprietà e array che non devono essere riassegnati, specialmente nei modelli condivisi in `packages/common/src/models`.
- **Non indentare i parametri di una funzione in verticale.**
- **Test:** ogni nuovo file `*.utils.ts` / `*.model.ts` con logica eseguibile deve avere uno spec Vitest associato (`*.spec.ts`) per non abbassare la coverage al 100% richiesta.

---