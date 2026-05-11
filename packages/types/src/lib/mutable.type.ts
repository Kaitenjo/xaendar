export type Mutable<T extends Object> = {
  -readonly [P in keyof T]: T[P];
};