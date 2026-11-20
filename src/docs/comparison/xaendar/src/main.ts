import { loadSignals } from '@xaendar/signals';
import { mountTelemetry } from '../../shared/telemetry';

/*
  Installs the Signal polyfill before the modules of @xaendar/core are evaluated, then loads the page.
*/
mountTelemetry('Xaendar');
loadSignals();
await import('./bootstrap');
