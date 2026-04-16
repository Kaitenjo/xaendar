import { loadSignals } from "@xaendar/signals";

loadSignals();

const state = new Signal.State(0);
let version = 0
const computed = new Signal.Computed(() => {
  console.log(version++);
  return Signal.subtle.untrack(() => state.get()) * 2;  
});
const watcher = new Signal.subtle.Watcher(() => {
  console.log('Watcher notified:');
});
watcher.watch(computed);
computed.get();

state.set(1);
computed.get();

state.set(2);
computed.get();

state.set(2);
computed.get();

state.set(3);
computed.get();