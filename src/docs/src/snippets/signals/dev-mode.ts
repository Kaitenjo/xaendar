import { loadSignals } from '@xaendar/signals';

// Logs the errors thrown inside computed signals, watchers and the watched/unwatched callbacks,
// and warns about invalid state transitions of the reactive graph.
loadSignals({ devMode: import.meta.env.DEV });
