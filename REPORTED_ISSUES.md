# Problemi segnalati

Trovati durante la scrittura dell'API reference (ottobre 2026) e non corretti. I numeri di riga si riferiscono allo stato del working tree di quel momento.

## @xaendar/compiler / language-core


## @xaendar/common

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
