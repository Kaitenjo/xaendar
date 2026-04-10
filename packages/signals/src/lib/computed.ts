import { Signal } from "./models/signal.interface";
import { State } from "./state";

export class Computed<T> extends State<T> {
  #sources: Set<Signal<unknown>>;
  get: () => T;

  public get state(): 'clean' | 'checked' | 'computing' | 'dirty' {
    return 'clean';
  }

  /**
   * 
   * @param source 
   * @internal
   */
  public addSource(source: Signal<unknown>) {
    this.#sources.add(source);
  }
}