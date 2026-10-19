# Problemi segnalati

Trovati durante la scrittura dell'API reference (ottobre 2026) e non corretti. I numeri di riga si riferiscono allo stato del working tree di quel momento.

## @xaendar/compiler / language-core


## @xaendar/common



## @xaendar/cli


## @xaendar/vscode-client

27. **La grammatica non colora i tag con caratteri non ASCII.** `packages/vscode-client/syntaxes/xaendar-template.tmLanguage.json`, regola `custom-tag-open`: il nome del tag deve corrispondere a `[a-z][\w.]*-[\w.-]*`, quindi un tag come `<my-élément>`, valido per il browser e per il compilatore dopo il fix di `isValidCustomElementName`, mantiene i colori dell'HTML semplice. Il limite è descritto tra i casi limite della pagina "Language service and VS Code".

## Documentazione

28. **15 test di `xd test` falliscono** (`npm test --prefix src/docs`), già al commit `fad13c9b`: tutti quelli di `examples/components/host-bindings/toggle-switch`, `examples/components/queries/ref-query` e `pages/components/switch-button`. I componenti non hanno la render function ("ToggleSwitchComponent does not seem to have a Render Function"), quindi i loro template non vengono compilati quando girano i test. Alcuni falliscono anche con "TypeError: stop is not a function".
