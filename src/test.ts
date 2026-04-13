import { Computed } from "../packages/signals/src/lib/models/computed";
import { State } from "../packages/signals/src/lib/models/state";
import { Watcher } from "../packages/signals/src/lib/models/watcher";

// ─── Test 1: State base ───────────────────────────────────────────────────────
console.log('=== Test 1: State base ===');

const counter = new State(0);
console.log(counter.get() === 0);                // true

counter.set(1);
console.log(counter.get() === 1);                // true

counter.set(1);                                  // stesso valore, no propagazione
console.log(counter.get() === 1);                // true

// ─── Test 2: Computed non osservato — esegue sempre ──────────────────────────
console.log('\n=== Test 2: Computed non osservato ===');

let computeCount = 0;
const doubled = new Computed(() => {
  computeCount++;
  return counter.get() * 2;
});

console.log(doubled.get() === 2);                // true
console.log(doubled.get() === 2);                // true — ricalcola sempre
console.log(computeCount === 2);                 // true

counter.set(5);
console.log(doubled.get() === 10);               // true
console.log(computeCount === 3);                 // true

// ─── Test 3: Computed chain non osservata ─────────────────────────────────────
console.log('\n=== Test 3: Computed chain non osservata ===');

const isEven = new Computed(() => counter.get() % 2 === 0);
const label = new Computed(() => isEven.get() ? 'pari' : 'dispari');

counter.set(4);
console.log(label.get() === 'pari');             // true

counter.set(7);
console.log(label.get() === 'dispari');          // true

// ─── Test 4: Watcher — notify sincrona ───────────────────────────────────────
console.log('\n=== Test 4: Watcher ===');

const name = new State('Mario');
const greeting = new Computed(() => `Ciao, ${name.get()}!`);

const notifications: string[] = [];
const watcher = new Watcher(() => {
  notifications.push('notified');
});

watcher.watch(greeting);
greeting.get();                                  // prima valutazione

name.set('Luigi');
console.log(notifications.length === 1);         // true
console.log(greeting.get() === 'Ciao, Luigi!'); // true

// ─── Test 5: Watcher notifica una sola volta per ciclo ────────────────────────
console.log('\n=== Test 5: Watcher single notify ===');

name.set('Peach');
name.set('Bowser');                              // notify NON chiamata di nuovo
console.log(notifications.length === 1);         // true — ancora 1

watcher.watch();                                 // reset
name.set('Toad');
console.log(notifications.length === 2);         // true

// ─── Test 6: Computed osservato — caching attivo ─────────────────────────────
console.log('\n=== Test 6: Computed osservato con caching ===');

const base = new State(2);
let watchedComputeCount = 0;
const watchedDoubled = new Computed(() => {
  watchedComputeCount++;
  return base.get() * 2;
});

let watchedComputeCountLabel = 0;
const watchedLabel = new Computed(() => {
  watchedComputeCountLabel++;
  return watchedDoubled.get() > 5 ? 'grande' : 'piccolo';
});

const watcher2 = new Watcher(() => {});
watcher2.watch(watchedLabel);
watchedLabel.get();                              // prima valutazione

const countAfterFirst = watchedComputeCount;
watchedLabel.get();
console.log(watchedComputeCount === countAfterFirst); // true — non ricalcola

base.set(4);                                     // watchedDoubled → dirty, watchedLabel → checked
watcher2.watch();                                // reset watcher
watchedLabel.get();
console.log(watchedComputeCount === countAfterFirst + 1); // true — ricalcola una volta

// ─── Test 7: equals custom ────────────────────────────────────────────────────
console.log('\n=== Test 7: equals custom ===');

const obj = new State({ x: 1 }, {
  equals: (a, b) => a.x === b.x
});

let objNotified = false;
const watcher3 = new Watcher(() => { objNotified = true; });
const objComputed = new Computed(() => obj.get().x * 10);
watcher3.watch(objComputed);
objComputed.get();

obj.set({ x: 1 });                               // stesso x → no propagazione
console.log(objNotified === false);              // true

obj.set({ x: 2 });                               // x diverso → propagazione
console.log(objNotified === true);               // true

// ─── Test 8: unwatch ─────────────────────────────────────────────────────────
console.log('\n=== Test 8: unwatch ===');

const src = new State(0);
const derived = new Computed(() => src.get() + 1);
let unwatchNotified = false;

const watcher4 = new Watcher(() => { unwatchNotified = true; });
watcher4.watch(derived);
derived.get();

watcher4.unwatch(derived);
src.set(99);
console.log(unwatchNotified === false);          // true — non più osservato

// ─── Test 9: errore cachato ───────────────────────────────────────────────────
console.log('\n=== Test 9: errore ===');

const dangerous = new State(0);
const risky = new Computed(() => {
  if (dangerous.get() === 0) throw new Error('valore non valido');
  return dangerous.get() * 10;
});

try {
  risky.get();
  console.log(false);                            // non deve arrivare qui
} catch (e) {
  console.log((e as Error).message === 'valore non valido'); // true
}

dangerous.set(3);
console.log(risky.get() === 30);                 // true

// ─── Test 10: dipendenze dinamiche ───────────────────────────────────────────
console.log('\n=== Test 10: dipendenze dinamiche ===');

const flag = new State(true);
const a = new State(1);
const b = new State(100);

const dynamic = new Computed(() => flag.get() ? a.get() : b.get());

console.log(dynamic.get() === 1);               // true — dipende da a

flag.set(false);
console.log(dynamic.get() === 100);             // true — dipende da b

a.set(999);
console.log(dynamic.get() === 100);             // true — a non è più una dipendenza