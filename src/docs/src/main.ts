import { loadSignals } from '@xaendar/signals';

/*
  Installs the global Signal polyfill, then loads the application on demand: the modules of @xaendar/core need
  it as soon as they are evaluated, and the bundler puts them in a chunk the entry imports statically, which
  would be evaluated before the polyfill is installed.
*/
loadSignals();
await import('./bootstrap');
