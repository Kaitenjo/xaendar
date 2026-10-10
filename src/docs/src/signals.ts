import { loadSignals } from '@xaendar/signals';

/*
  Installs the global Signal polyfill. It must run before any module of @xaendar/core is evaluated,
  which is why index.html loads it as its own module script, before main.ts.
*/
loadSignals();
