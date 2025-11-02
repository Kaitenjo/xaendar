export type Beautify<T extends Object> = {
  [K in keyof T]: T[K] 
} & {}