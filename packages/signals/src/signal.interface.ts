export interface Signal<T> {
  get: () => T;
}