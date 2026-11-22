import { loadSignals } from '@xaendar/signals';

/*
  Installs the Signal polyfill before the modules of @xaendar/core are evaluated, then loads the page.
*/
loadSignals();
await import('./bootstrap');
