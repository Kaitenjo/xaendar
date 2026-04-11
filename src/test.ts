import { generateRenderFunction, Lexer, Parser } from '@xendar/compiler';
import { Computed, State, Watcher } from '@xendar/signals';

// export function compile(input: string): string {
//   const tokens = new Lexer(input).tokenize();
//   console.log(tokens)
//   const ast = new Parser(tokens).parse();
//   console.log(ast)
//   let a = generateRenderFunction(ast)
//   console.log(a)
//   return a;
// }

// const template =`
// <label for={id} aria-label={label}>
//   {label}
// </label>
// @if (id) {
//   <span>Id is present</span>
// } @else {
//   <span>Id is missing</span>
// }

// @for (let item of items) {
//   <div>{item}</div>
// }

// @switch (status) {
//   @case ('loading') {
//     <div>Loading...</div>
//   }
  
//   @case ('error') {
//     <div>Error!</div>
//   }
  
//   @default {
//     <div>Content</div>
//   }
// }
// <input id={id} type='text' value={ value + '' + 'asd' + ' ' + 'test' } placeholder={placeholder} @change='onChange($event)' />
// `

// compile(template)

// ─── Test 2: Computed lazy ────────────────────────────────────────────────────
console.log('\n=== Test 2: Computed lazy ===');
const counter = new State(5);

// // ─── Test 3: Computed chain ───────────────────────────────────────────────────
console.log('\n=== Test 3: Computed chain ===');

const isEven = new Computed(() => {
  console.log('  [computed] ricalcolo isEven');
  return counter.get() % 2 === 0;
});

const label = new Computed(() => {
  console.log('  [computed] ricalcolo label');
  return isEven.get() ? 'pari' : 'dispari';
});

console.log('AAAA')
label.get(); // ricalcola isEven → ricalcola label → 'dispari'
label.get(); // nessun log (cached)

counter.set(4);
label.get(); // ricalcola isEven → ricalcola label → 'pari'

counter.set(6); // ancora pari
console.log(label.get()); // ricalcola isEven, ma label NON ricalcola (stesso valore 'pari')

// // ─── Test 4: Watcher ──────────────────────────────────────────────────────────
// console.log('\n=== Test 4: Watcher ===');

// const name = new State('Mario');
// const greeting = new Computed(() => `Ciao, ${name.get()}!`);

// const notifications: string[] = [];

// const watcher = new Watcher(() => {
//   console.log('  [watcher] notify chiamata');
//   notifications.push('notified');
// });

// watcher.watch(greeting);
// greeting.get(); // prima valutazione

// name.set('Luigi');
// console.log(notifications); // ['notified']
// console.log(greeting.get()); // 'Ciao, Luigi!'

// // ─── Test 5: Watcher non ri-notifica finché non chiami watch() ────────────────
// console.log('\n=== Test 5: Watcher single notify ===');

// name.set('Peach');
// name.set('Bowser'); // notify NON viene chiamata di nuovo
// console.log(notifications.length); // ancora 1 — notify chiamata una sola volta

// watcher.watch(); // reset
// name.set('Toad');
// console.log(notifications.length); // 2 — ora viene notificato di nuovo

// // ─── Test 6: unwatch ─────────────────────────────────────────────────────────
// console.log('\n=== Test 6: unwatch ===');

// watcher.unwatch(greeting);
// name.set('Yoshi');
// console.log(notifications.length); // ancora 2 — non più osservato

// // ─── Test 7: Computed con errore cachato ──────────────────────────────────────
// console.log('\n=== Test 7: errore cachato ===');

// const dangerous = new State(0);
// const risky = new Computed(() => {
//   if (dangerous.get() === 0) throw new Error('valore non valido');
//   return dangerous.get() * 10;
// });

// try {
//   risky.get(); // lancia
// } catch (e) {
//   console.log((e as Error).message); // 'valore non valido'
// }

// dangerous.set(3);
// console.log(risky.get()); // 30