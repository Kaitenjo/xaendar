import { loadSignals } from '@xaendar/signals';

// Installs the global `Signal` (TC39 proposal polyfill) used by @xaendar/core
loadSignals();
// Loaded dynamically: a static import would be evaluated before loadSignals() runs
await import('./bootstrap');
