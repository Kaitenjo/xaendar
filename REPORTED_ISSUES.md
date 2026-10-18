# Problemi segnalati

Trovati durante la scrittura dell'API reference (ottobre 2026) e non corretti. I numeri di riga si riferiscono allo stato del working tree di quel momento.

## @xaendar/signals

1. **`watched`/`unwatched` ripartono a ogni rivalutazione.** `packages/signals/src/lib/models/computed/computed.ts:353-356` scollega un computed da tutte le sorgenti prima di rileggerle: un signal letto da un solo dipendente riceve `unwatched` e poi `watched` a ogni esecuzione. Inoltre `computed.ts:220-224` collega qualunque computed valutato, anche se nessuno lo osserva: `watched` scatta e lo state tiene un riferimento al computed. Contraddice la guida (`pages.signals.options.watchedAndUnwatched.p1`, "primo dipendente vivo") e il JSDoc "live" di `subtle.ts:52-74`. L'esempio `src/docs/src/examples/signals/options/watched/watched.xd.component.ts` riavvia l'intervallo a ogni tick. Le pagine API di `SignalOptions`, `signal` e `Property` descrivono il comportamento attuale: se si corregge, vanno aggiornate.
2. **`notify` del Watcher scatta a ogni modifica.** `packages/signals/src/lib/models/watcher/watcher.ts:221-239` chiama la callback qualunque sia lo stato del watcher, e `state.ts:152-154` notifica a ogni modifica. La guida dice "notifica una volta, poi va riarmato" (`en.json` `pages.signals.advanced`). Il commento di `watcher.spec.ts:224-229` contraddice l'aspettativa di 2 chiamate. Anche la pagina API di `Signal.subtle` descrive il comportamento attuale.
3. **Rilevamento dei cicli.** `computed.ts:358-359` con `#isValidTransition` (482-493) ignora la transizione clean→computing: dalla seconda lettura di un computed senza sink, un computed che legge se stesso va in stack overflow (RangeError) invece di lanciare "Circular dependency detected". In dev mode ogni rilettura di un computed senza sink logga "Invalid state transition from clean to computing".
4. **Tipi più larghi del runtime.** `Signal`/`Computed`/`InputSignal`/`QuerySignal` di core estendono `Signal.State`/`Signal.Computed` (`packages/core/src/signals/types/signal.type.ts:9`, `computed.type.ts:9`), ma a runtime sono funzioni: `instanceof` è falso, e `watcher.watch(count)`, `Signal.subtle.introspectSinks(count)`, `hasSinks` passano il type-check e lanciano `signal.addSink is not a function`. `watch()` aggiunge comunque la funzione al suo set prima di lanciare (`watcher.ts:137-138`).
5. **Gli hook di un effect girano senza `fn`.** Quando le dipendenze di una ri-esecuzione sono computed che hanno mantenuto il valore, `onBeforeRun`/`onAfterRun` vengono chiamati ma `fn` no (`packages/core/src/signals/effect/effect.ts:62-78`). Documentato così nella pagina di `effect`: forse non è voluto.

## @xaendar/core

6. **Query su una sottoclasse non decorata.** `@Query(SottoclasseNonDecorata)` probabilmente risolve il selettore del padre invece di lanciare, perché i metadati di classe si ereditano (`packages/core/src/utils/get-selector/get-selector.util.ts:14`). Ragionato, non provato.
7. **`hostDirectives` ereditate.** Una sottoclasse che non dichiara `hostDirectives` eredita a runtime quelle del padre (stesso meccanismo dei metadati), ma il compilatore legge solo il decoratore della classe stessa. Non provato.
8. **Spec con import inesistente.** `packages/core/src/models/custom-element/custom-element.spec.ts:2` importa `EffectOptions` da `@xaendar/signals`, che non lo esporta (le spec non sono type-checkate).

## @xaendar/compiler / language-core

9. **L'editor ignora `customElements`.** `packages/language-core/src/lib/template-analysis/template-analysis.ts:206` passa `[]`: l'editor probabilmente segnala come errore i tag delle librerie esterne. Non verificato in VS Code.
10. **Ogni import da `@xaendar/core/signals` conta come signal.** `packages/compiler/src/utils/extract-component-members/extract-component-members.utils.ts:252-280`: un membro annotato `EffectOptions` o inizializzato con `effect()` è trattato come signal. Rende solo reattivi più binding del necessario.
11. **`$event` sugli output void.** Il compilatore accetta `$event` anche sugli output senza dettaglio, tipizzato `CustomEvent<null>`, mentre la guida Outputs dice che un template passa `$event` solo agli eventi che portano un dettaglio.

## @xaendar/common

12. **`Stack`, firme degli indici.** `packages/common/src/models/stack/stack.ts:12`: `[index: number]: T` permette `stack[0] = x`, ma la scrittura si perde (le letture vengono da `_elements`). `[prop: string | symbol]: unknown` (riga 14) fa compilare refusi come `stack.lenght`.
13. **`keys`/`entries`/`values`.** `packages/common/src/utils/object/object-utils.ts:28-70`: un argomento tipizzato `Obj | undefined` non corrisponde a nessun overload ("No overload matches this call"), quindi l'overload `undefined` funziona solo con un `undefined` letterale. I tipi dichiarano chiavi numeriche (`1[]`), ma a runtime le chiavi sono stringhe (`['1']`).
14. **`isValidCustomElementName` è più severa della specifica HTML**, che accetta caratteri non ASCII (`my-élément`), mentre la guida Selectors and registration dice che il compilatore applica "le stesse regole" del browser.
15. **`Array.prototype.removeItem`.** `packages/common/src/utils/array/array.util.ts` installa un'estensione di `Array.prototype`: non è un export, quindi non è nella reference. Decidere se documentarla.

## @xaendar/types

16. **`PositiveInteger`** (`packages/types/src/lib/positive-integer.type.ts`) accetta `0` nonostante il nome, e dà `number` per i valori non letterali.
17. **`Function`/`AsyncFunction`** (`functions/function.type.ts`, `async-function.type.ts`): la condizione `Arguments extends Array<any>` è sempre vera, quindi il ramo `() =>` è morto; lascia il tipo irrisolto finché `Arguments` è generico (una funzione generica non può restituire una arrow function senza cast); le tuple unione si distribuiscono.
18. **Nome del file** `functions/no-args-void-async-function.type.ts` non corrisponde al tipo `NoArgsAsyncVoidFunction`.
19. **`FieldDecorator`**: un `ReturnType` non assegnabile a `Field` rende il decoratore inapplicabile (TS1270).

## @xaendar/cli

20. **`toPascalCase` mantiene i punti**: `xd g c my.el-x`, nome valido, genera `class My.elXComponent`, TypeScript non valido (`packages/cli/src/commands/generate/component/component.command.ts:72`).

## Documentazione

21. **Guida Build, type check.** `en.json`/`it.json` `pages.tools.build.summary.td6` dice che il type check riguarda solo i template, mentre `errors.p2` della stessa pagina dice che controlla tutto il progetto.
22. **Guida Events.** `pages.templates.events.edgeCases.callout3` dice che su un tag di componente si legano solo gli `@Event` dichiarati; il compilatore accetta anche gli eventi nativi, e la guida Outputs (callout4) concorda con il compilatore.
23. **Snippet `tools/component-name-errors.txt`**: il messaggio dei nomi riservati non riporta l'elenco "Reserved names are: …" che la funzione stampa davvero.
24. **Skill `plugins/xaendar/skills/xaendar/references/api.md:272` e `:296`** elencano i simboli `[Signal.subtle.watched]`/`[Signal.subtle.unwatched]`, che non esistono.
25. **Highlighter e file CRLF.** In `src/docs/src/core/highlight/highlight.ts` il commento `//` di `TS_TOKEN_RE` include il `\r` dei file CRLF: il parser HTML lo trasforma in un a capo, e le righe con un commento finale mostrano una riga vuota in più (es. `snippets/components/web-component-options.ts`).
26. **Esempio `content-queries/tabs`**: `src/docs/src/examples/components/content-queries/tabs/tab-group.xd.component.ts` usa `.forEach`, vietato dalle regole di stile.
