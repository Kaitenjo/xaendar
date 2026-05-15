// import { Lexer, Parser, generateRenderFunction, TokenType } from '@xaendar/compiler';
// import { writeFileSync } from 'fs';

// // loadSignals();


// // /**
// //  * Runs a side-effectful function and automatically re-runs it whenever any
// //  * Signal read during its execution changes.
// //  *
// //  * Internally, `effect` wraps the user callback inside a `Computed` node
// //  * (for dependency tracking) and observes it with a `Watcher` (for push
// //  * notifications). When any tracked dependency changes, the `Watcher`
// //  * schedules a microtask that re-evaluates the `Computed`, which in turn
// //  * re-runs the user callback and re-registers the new set of dependencies.
// //  *
// //  * The returned disposer function stops the effect: it unwatches the internal
// //  * `Computed` from the `Watcher`, severing all dependency subscriptions so
// //  * the callback is never called again and the graph nodes can be
// //  * garbage-collected.
// //  *
// //  * @example
// //  * ```ts
// //  * const count = new State(0);
// //  *
// //  * const stop = effect(() => {
// //  *   console.log('count is', count.get());
// //  * });
// //  * // logs: "count is 0"
// //  *
// //  * count.set(1); // logs: "count is 1"
// //  * count.set(2); // logs: "count is 2"
// //  *
// //  * stop();       // no more logs
// //  * count.set(3); // silent
// //  * ```
// //  *
// //  * @param fn - The side-effectful function to run. Any Signal read inside it
// //  *   is tracked as a dependency.
// //  * @returns A disposer function that, when called, permanently stops the effect.
// //  */
// // export function effect(fn: NoArgsVoidFunction): NoArgsVoidFunction {
// //   /**
// //    * Wrap the user callback in a Computed so that automatic dependency
// //    * tracking (via pushComputed / popComputed) works for free.
// //    * The Computed always returns `undefined` — we only care about the
// //    * side-effects and the tracked sources, not the value.
// //    */
// //   const computed = new Signal.Computed<void>(() => fn());

// //   let needsEnqueue = true;

// //   /**
// //    * The Watcher is notified synchronously as soon as any tracked dependency
// //    * changes. Its job is purely to schedule the re-execution; the actual
// //    * re-evaluation happens asynchronously in a microtask so that multiple
// //    * synchronous signal updates are batched into a single re-run.
// //    */
// //   const watcher = new Signal.subtle.Watcher(() => {
// //     if (needsEnqueue) {
// //       needsEnqueue = false;
// //       queueMicrotask(() => {
// //         needsEnqueue = true;
// //         watcher.getPending().forEach(computed => computed.get());
// //         watcher.watch();
// //       });
// //     }
// //   });

// //   // Initial synchronous execution + first subscription.
// //   watcher.watch(computed);
// //   computed.get();

// //   /**
// //    * Disposer — call this to permanently stop the effect.
// //    *
// //    * Unwatching the Computed tears down the entire live dependency chain
// //    * (Watcher → Computed → all sources), preventing any further
// //    * notifications and allowing GC.
// //    */
// //   return () => watcher.unwatch(computed);
// // }

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
// <input id={id} type="text" value={ value + '' + 'asd' + ' ' + "test" } placeholder={placeholder} @change="onChange($event)" />
// `

// export function compile(input: string): string {
//   const tokens = new Lexer(input).tokenize();
//   console.log(
//     tokens.map(t => ({ type: TokenType[t.type], ...('parts' in t ? { parts: t.parts } : {}) }))
//   );
//   const ast = new Parser(tokens).parse();
//   console.log(ast)
//   let a = generateRenderFunction(ast)
//   console.log(a)
//   return a;
// }

// const filePath = 'test.js'
// writeFileSync(filePath, compile(template));

// // const state = new Signal.State(1);
// // const state2 = new Signal.State(2);
// // effect(() => {
// //   console.log(state.get());
// //   console.log(state2.get());
// //   return state.get() + state2.get();
// // })

// // state.set(10)
// // state.set(20)
// // state.set(10)
// // state.set(20)
// // state.set(10)
// // state.set(20)
// // state2.set(10)
// // state2.set(20)
// // state2.set(10)
// // state2.set(20)

// // export function onClick(): void {
// //   state2.set(40);
// // }

// // document.querySelector('button')?.addEventListener('click', onClick);
import { MyButtonComponent } from "./myButton/myButton.xd.component";
console.log(MyButtonComponent);