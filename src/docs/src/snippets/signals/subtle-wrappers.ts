import { computed, introspectSinks, isState, signal, watch } from '@xaendar/core/signals';

const price = signal(10);
const total = computed(() => price() * 2);
const watcher = new Signal.subtle.Watcher(() => {});

isState(price);           // true, while price instanceof Signal.State is false
watch(watcher, total);
total();
introspectSinks(price);   // [total]: the function returned by computed()
