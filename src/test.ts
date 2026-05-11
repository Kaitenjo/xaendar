// import type { NoArgsVoidFunction } from '@xaendar/types';
// import { loadSignals } from "@xaendar/signals";

// loadSignals();


// /**
//  * Runs a side-effectful function and automatically re-runs it whenever any
//  * Signal read during its execution changes.
//  *
//  * Internally, `effect` wraps the user callback inside a `Computed` node
//  * (for dependency tracking) and observes it with a `Watcher` (for push
//  * notifications). When any tracked dependency changes, the `Watcher`
//  * schedules a microtask that re-evaluates the `Computed`, which in turn
//  * re-runs the user callback and re-registers the new set of dependencies.
//  *
//  * The returned disposer function stops the effect: it unwatches the internal
//  * `Computed` from the `Watcher`, severing all dependency subscriptions so
//  * the callback is never called again and the graph nodes can be
//  * garbage-collected.
//  *
//  * @example
//  * ```ts
//  * const count = new State(0);
//  *
//  * const stop = effect(() => {
//  *   console.log('count is', count.get());
//  * });
//  * // logs: "count is 0"
//  *
//  * count.set(1); // logs: "count is 1"
//  * count.set(2); // logs: "count is 2"
//  *
//  * stop();       // no more logs
//  * count.set(3); // silent
//  * ```
//  *
//  * @param fn - The side-effectful function to run. Any Signal read inside it
//  *   is tracked as a dependency.
//  * @returns A disposer function that, when called, permanently stops the effect.
//  */
// export function effect(fn: NoArgsVoidFunction): NoArgsVoidFunction {
//   /**
//    * Wrap the user callback in a Computed so that automatic dependency
//    * tracking (via pushComputed / popComputed) works for free.
//    * The Computed always returns `undefined` — we only care about the
//    * side-effects and the tracked sources, not the value.
//    */
//   const computed = new Signal.Computed<void>(() => fn());

//   let needsEnqueue = true;

//   /**
//    * The Watcher is notified synchronously as soon as any tracked dependency
//    * changes. Its job is purely to schedule the re-execution; the actual
//    * re-evaluation happens asynchronously in a microtask so that multiple
//    * synchronous signal updates are batched into a single re-run.
//    */
//   const watcher = new Signal.subtle.Watcher(() => {
//     if (needsEnqueue) {
//       needsEnqueue = false;
//       queueMicrotask(() => {
//         needsEnqueue = true;
//         watcher.getPending().forEach(computed => computed.get());
//         watcher.watch();
//       });
//     }
//   });

//   // Initial synchronous execution + first subscription.
//   watcher.watch(computed);
//   computed.get();

//   /**
//    * Disposer — call this to permanently stop the effect.
//    *
//    * Unwatching the Computed tears down the entire live dependency chain
//    * (Watcher → Computed → all sources), preventing any further
//    * notifications and allowing GC.
//    */
//   return () => watcher.unwatch(computed);
// }

// const state = new Signal.State(1);
// const state2 = new Signal.State(2);
// effect(() => {
//   console.log(state.get());
//   console.log(state2.get());
//   return state.get() + state2.get();
// })

// state.set(10)
// state.set(20)
// state.set(10)
// state.set(20)
// state.set(10)
// state.set(20)
// state2.set(10)
// state2.set(20)
// state2.set(10)
// state2.set(20)

// export function onClick(): void {
//   state2.set(40);
// }

// document.querySelector('button')?.addEventListener('click', onClick);

/**
 * Rappresenta un punto nel piano cartesiano.
 */
interface Point {
  x: number;
  y: number;
}

/**
 * Classe che rappresenta un rettangolo con varie proprietà e metodi.
 */
class Rectangle {
  /** @internal */ _width: number;
  /** @internal */ _height: number;
  /** @internal */ _x: number;
  /** @internal */ _y: number;
  /** @internal */ _color: string;

  /**
   * @param width  Larghezza del rettangolo (deve essere > 0)
   * @param height Altezza del rettangolo (deve essere > 0)
   * @param x      Coordinata X dell'angolo in alto a sinistra (default: 0)
   * @param y      Coordinata Y dell'angolo in alto a sinistra (default: 0)
   * @param color  Colore del rettangolo (default: "black")
   */
  constructor(
    width: number,
    height: number,
    x: number = 0,
    y: number = 0,
    color: string = "black"
  ) {
    if (width <= 0 || height <= 0) {
      throw new Error("Larghezza e altezza devono essere maggiori di zero.");
    }
    this._width = width;
    this._height = height;
    this._x = x;
    this._y = y;
    this._color = color;
  }

  // ─────────────────────────────────────────────
  //  Getter & Setter
  // ─────────────────────────────────────────────

  get width(): number {
    return this._width;
  }

  set width(value: number) {
    if (value <= 0) throw new Error("La larghezza deve essere maggiore di zero.");
    this._width = value;
  }

  get height(): number {
    return this._height;
  }

  set height(value: number) {
    if (value <= 0) throw new Error("L'altezza deve essere maggiore di zero.");
    this._height = value;
  }

  get x(): number {
    return this._x;
  }

  set x(value: number) {
    this._x = value;
  }

  get y(): number {
    return this._y;
  }

  set y(value: number) {
    this._y = value;
  }

  get color(): string {
    return this._color;
  }

  set color(value: string) {
    this._color = value;
  }

  // ─────────────────────────────────────────────
  //  Proprietà calcolate
  // ─────────────────────────────────────────────

  /** Area del rettangolo (larghezza × altezza) */
  get area(): number {
    return this._width * this._height;
  }

  /** Perimetro del rettangolo */
  get perimeter(): number {
    return 2 * (this._width + this._height);
  }

  /** Diagonale del rettangolo */
  get diagonal(): number {
    return Math.sqrt(this._width ** 2 + this._height ** 2);
  }

  /** Indica se il rettangolo è un quadrato */
  get isSquare(): boolean {
    return this._width === this._height;
  }

  /** Rapporto larghezza/altezza */
  get aspectRatio(): number {
    return this._width / this._height;
  }

  /** Centro del rettangolo come punto */
  get center(): Point {
    return {
      x: this._x + this._width / 2,
      y: this._y + this._height / 2,
    };
  }

  /** I quattro angoli del rettangolo */
  get corners(): { topLeft: Point; topRight: Point; bottomLeft: Point; bottomRight: Point } {
    return {
      topLeft:     { x: this._x,                y: this._y },
      topRight:    { x: this._x + this._width,  y: this._y },
      bottomLeft:  { x: this._x,                y: this._y + this._height },
      bottomRight: { x: this._x + this._width,  y: this._y + this._height },
    };
  }

  // ─────────────────────────────────────────────
  //  Metodi di trasformazione
  // ─────────────────────────────────────────────

  // ─────────────────────────────────────────────
  //  Metodi di trasformazione (dynamic import)
  // ─────────────────────────────────────────────

  /**
   * Ridimensiona il rettangolo moltiplicando larghezza e altezza per un fattore.
   * @param factor Fattore di scala (es. 2 → dimensioni doppie)
   */
  async scale(factor: number): Promise<this> {
    const scale = (await import('./rectangle-chunks/scale')).default;
    scale(this, factor);
    return this;
  }

  /**
   * Trasla il rettangolo di (dx, dy).
   */
  async translate(dx: number, dy: number): Promise<this> {
    const translate = (await import('./rectangle-chunks/translate')).default;
    translate(this, dx, dy);
    return this;
  }

  /**
   * Ruota logicamente il rettangolo di 90° (scambia larghezza e altezza).
   */
  async rotate90(): Promise<this> {
    const rotate90 = (await import('./rectangle-chunks/rotate90')).default;
    rotate90(this);
    return this;
  }

  /**
   * Centra il rettangolo attorno a un punto dato.
   */
  async centerOn(point: Point): Promise<this> {
    const centerOn = (await import('./rectangle-chunks/center-on')).default;
    centerOn(this, point);
    return this;
  }

  // ─────────────────────────────────────────────
  //  Metodi geometrici / relazionali (dynamic import)
  // ─────────────────────────────────────────────

  /**
   * Verifica se un punto è contenuto all'interno del rettangolo.
   */
  async containsPoint(point: Point): Promise<boolean> {
    const containsPoint = (await import('./rectangle-chunks/contains-point')).default;
    return containsPoint(this, point);
  }

  /**
   * Verifica se il rettangolo si sovrappone a un altro.
   */
  async intersects(other: Rectangle): Promise<boolean> {
    const intersects = (await import('./rectangle-chunks/intersects')).default;
    return intersects(this, other);
  }

  /**
   * Verifica se il rettangolo contiene completamente un altro.
   */
  async contains(other: Rectangle): Promise<boolean> {
    const contains = (await import('./rectangle-chunks/contains')).default;
    return contains(this, other);
  }

  /**
   * Restituisce il rettangolo di intersezione con un altro, o null se non si sovrappongono.
   */
  async intersection(other: Rectangle): Promise<Rectangle | null> {
    const intersection = (await import('./rectangle-chunks/intersection')).default;
    const result = intersection(this, other);
    return result ? new Rectangle(result.width, result.height, result.x, result.y) : null;
  }

  /**
   * Restituisce il bounding box (rettangolo minimo) che racchiude questo e un altro rettangolo.
   */
  async union(other: Rectangle): Promise<Rectangle> {
    const union = (await import('./rectangle-chunks/union')).default;
    const result = union(this, other);
    return new Rectangle(result.width, result.height, result.x, result.y);
  }

  /**
   * Distanza euclidea tra i centri di due rettangoli.
   */
  async distanceTo(other: Rectangle): Promise<number> {
    const distanceTo = (await import('./rectangle-chunks/distance-to')).default;
    return distanceTo(this.center, other.center);
  }

  // ─────────────────────────────────────────────
  //  Metodi di utilità (dynamic import)
  // ─────────────────────────────────────────────

  /**
   * Crea una copia indipendente del rettangolo.
   */
  async clone(): Promise<Rectangle> {
    const clone = (await import('./rectangle-chunks/clone')).default;
    const data = clone(this);
    return new Rectangle(data.width, data.height, data.x, data.y, data.color);
  }

  /**
   * Verifica se due rettangoli sono uguali (stesse dimensioni e posizione).
   */
  async equals(other: Rectangle): Promise<boolean> {
    const equals = (await import('./rectangle-chunks/equals')).default;
    return equals(this, other);
  }

  /**
   * Crea un rettangolo da un oggetto plain.
   */
  static fromObject(obj: {
    width: number;
    height: number;
    x?: number;
    y?: number;
    color?: string;
  }): Rectangle {
    return new Rectangle(obj.width, obj.height, obj.x, obj.y, obj.color);
  }

  /**
   * Restituisce una rappresentazione JSON del rettangolo.
   */
  async toJSON(): Promise<object> {
    const toJSON = (await import('./rectangle-chunks/to-json')).default;
    return toJSON(this, {
      area: this.area,
      perimeter: this.perimeter,
      diagonal: this.diagonal,
      isSquare: this.isSquare,
      center: this.center,
    });
  }

  /**
   * Rappresentazione testuale leggibile del rettangolo.
   */
  async toString(): Promise<string> {
    const toString = (await import('./rectangle-chunks/to-string')).default;
    return toString(this, this.area, this.perimeter);
  }
}

// ─────────────────────────────────────────────
//  Wiring pulsanti
// ─────────────────────────────────────────────

const rect = new Rectangle(20, 10, 0, 0, "blue");
const other = new Rectangle(15, 8, 5, 3, "red");
const output = document.getElementById("output")!;

function log(label: string, value: unknown): void {
  output.textContent = `[${label}]\n${JSON.stringify(value, null, 2)}`;
}

document.getElementById("btn-scale")!.addEventListener("click", async () => {
  await rect.scale(2);
  log("scale(2)", { width: rect.width, height: rect.height });
});

document.getElementById("btn-translate")!.addEventListener("click", async () => {
  await rect.translate(10, 5);
  log("translate(10, 5)", { x: rect.x, y: rect.y });
});

document.getElementById("btn-rotate90")!.addEventListener("click", async () => {
  await rect.rotate90();
  log("rotate90()", { width: rect.width, height: rect.height });
});

document.getElementById("btn-centerOn")!.addEventListener("click", async () => {
  await rect.centerOn({ x: 50, y: 50 });
  log("centerOn({x:50, y:50})", { x: rect.x, y: rect.y, center: rect.center });
});

document.getElementById("btn-containsPoint")!.addEventListener("click", async () => {
  const result = await rect.containsPoint({ x: 5, y: 5 });
  log("containsPoint({x:5, y:5})", result);
});

document.getElementById("btn-intersects")!.addEventListener("click", async () => {
  const result = await rect.intersects(other);
  log("intersects(other)", result);
});

document.getElementById("btn-contains")!.addEventListener("click", async () => {
  const result = await rect.contains(other);
  log("contains(other)", result);
});

document.getElementById("btn-intersection")!.addEventListener("click", async () => {
  const result = await rect.intersection(other);
  log("intersection(other)", result ? { width: result.width, height: result.height, x: result.x, y: result.y } : null);
});

document.getElementById("btn-union")!.addEventListener("click", async () => {
  const result = await rect.union(other);
  log("union(other)", { width: result.width, height: result.height, x: result.x, y: result.y });
});

document.getElementById("btn-distanceTo")!.addEventListener("click", async () => {
  const result = await rect.distanceTo(other);
  log("distanceTo(other)", result);
});

document.getElementById("btn-clone")!.addEventListener("click", async () => {
  const cloned = await rect.clone();
  log("clone()", { width: cloned.width, height: cloned.height, x: cloned.x, y: cloned.y, color: cloned.color });
});

document.getElementById("btn-equals")!.addEventListener("click", async () => {
  const result = await rect.equals(other);
  log("equals(other)", result);
});

document.getElementById("btn-toJSON")!.addEventListener("click", async () => {
  const result = await rect.toJSON();
  log("toJSON()", result);
});

document.getElementById("btn-toString")!.addEventListener("click", async () => {
  const result = await rect.toString();
  log("toString()", result);
});