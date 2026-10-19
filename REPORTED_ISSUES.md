# Problemi segnalati

Trovati durante la scrittura dell'API reference (ottobre 2026) e non corretti. I numeri di riga si riferiscono allo stato del working tree di quel momento.

## @xaendar/compiler / language-core

9. **L'editor ignora `customElements`.** `packages/language-core/src/lib/template-analysis/template-analysis.ts:206` passa `[]`: l'editor probabilmente segnala come errore i tag delle librerie esterne. Non verificato in VS Code.
10. **Ogni import da `@xaendar/core/signals` conta come signal.** `packages/compiler/src/utils/extract-component-members/extract-component-members.utils.ts:252-280`: un membro annotato `EffectOptions` o inizializzato con `effect()` è trattato come signal. Rende solo reattivi più binding del necessario.
11. **`$event` sugli output void.** Il compilatore accetta `$event` anche sugli output senza dettaglio, tipizzato `CustomEvent<null>`, mentre la guida Outputs dice che un template passa `$event` solo agli eventi che portano un dettaglio.

## @xaendar/common

12. **`Stack`, firme degli indici.** `packages/common/src/models/stack/stack.ts:12`: `[index: number]: T` permette `stack[0] = x`, ma la scrittura si perde (le letture vengono da `_elements`). `[prop: string | symbol]: unknown` (riga 14) fa compilare refusi come `stack.lenght`.
13. **`keys`/`entries`/`values`.** `packages/common/src/utils/object/object-utils.ts:28-70`: un argomento tipizzato `Obj | undefined` non corrisponde a nessun overload ("No overload matches this call"), quindi l'overload `undefined` funziona solo con un `undefined` letterale. I tipi dichiarano chiavi numeriche (`1[]`), ma a runtime le chiavi sono stringhe (`['1']`).
14. **`isValidCustomElementName` è più severa della specifica HTML**, che accetta caratteri non ASCII (`my-élément`), mentre la guida Selectors and registration dice che il compilatore applica "le stesse regole" del browser.
15. **`Array.prototype.removeItem`.** `packages/common/src/utils/array/array.util.ts` installa un'estensione di `Array.prototype`: non è un export, quindi non è nella reference. Decidere se documentarla.


## @xaendar/cli

20. **`toPascalCase` mantiene i punti**: `xd g c my.el-x`, nome valido, genera `class My.elXComponent`, TypeScript non valido (`packages/cli/src/commands/generate/component/component.command.ts:72`).

## Documentazione

23. **Snippet `tools/component-name-errors.txt`**: il messaggio dei nomi riservati non riporta l'elenco "Reserved names are: …" che la funzione stampa davvero.
24. **Skill `plugins/xaendar/skills/xaendar/references/api.md:272` e `:296`** elencano i simboli `[Signal.subtle.watched]`/`[Signal.subtle.unwatched]`, che non esistono.
25. **Highlighter e file CRLF.** In `src/docs/src/core/highlight/highlight.ts` il commento `//` di `TS_TOKEN_RE` include il `\r` dei file CRLF: il parser HTML lo trasforma in un a capo, e le righe con un commento finale mostrano una riga vuota in più (es. `snippets/components/web-component-options.ts`).
26. **Esempio `content-queries/tabs`**: `src/docs/src/examples/components/content-queries/tabs/tab-group.xd.component.ts` usa `.forEach`, vietato dalle regole di stile.
