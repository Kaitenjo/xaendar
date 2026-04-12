import { State, Computed, Watcher } from "@xendar/signals";

const counter = new State(0);
counter.set(1);
counter.set(1); // stesso valore, equals non dovrebbe propagare

const doubled = new Computed(() => {
  console.log('  [computed] ricalcolo doubled');
  return counter.get() * 2;
});

counter.set(5);

const isEven = new Computed(() => {
  console.log('  [computed] ricalcolo isEven');
  return counter.get() % 2 === 0;
});

const label = new Computed(() => {
  console.log('  [computed] ricalcolo label');
  return isEven.get() ? 'pari' : 'dispari';
});

console.log(label.get()); // ricalcola isEven → ricalcola label → 'dispari'
console.log(label.get()); // nessun log (cached)

counter.set(4);
console.log(label.get()); // ricalcola isEven → ricalcola label → 'pari'

counter.set(6); // ancora pari
console.log(label.get()); // ricalcola isEven, ma label NON ricalcola (stesso valore 'pari')

// ─── Test 4: Watcher ──────────────────────────────────────────────────────────
console.log('\n=== Test 4: Watcher ===');

const name = new State('Mario');
const greeting = new Computed(() => `Ciao, ${name.get()}!`);

const notifications: string[] = [];

const watcher = new Watcher(() => {
  console.log('  [watcher] notify chiamata');
  notifications.push('notified');
});

watcher.watch(greeting);
greeting.get(); // prima valutazione

name.set('Luigi');
console.log(notifications); // ['notified']
console.log(greeting.get()); // 'Ciao, Luigi!'

// ─── Test 5: Watcher non ri-notifica finché non chiami watch() ────────────────
console.log('\n=== Test 5: Watcher single notify ===');

name.set('Peach');
name.set('Bowser'); // notify NON viene chiamata di nuovo
console.log(notifications.length); // ancora 1 — notify chiamata una sola volta

watcher.watch(); // reset
name.set('Toad');
console.log(notifications.length); // 2 — ora viene notificato di nuovo

// ─── Test 6: unwatch ─────────────────────────────────────────────────────────
console.log('\n=== Test 6: unwatch ===');

watcher.unwatch(greeting);
name.set('Yoshi');
console.log(notifications.length); // ancora 2 — non più osservato

// ─── Test 7: Computed con errore cachato ──────────────────────────────────────
console.log('\n=== Test 7: errore cachato ===');

const dangerous = new State(0);
const risky = new Computed(() => {
  if (dangerous.get() === 0) throw new Error('valore non valido');
  return dangerous.get() * 10;
});

try {
  risky.get(); // lancia
} catch (e) {
  console.log((e as Error).message); // 'valore non valido'
}

dangerous.set(3);
console.log(risky.get()); // 30