export type Dictionary<Key extends string | number, Value> = {
  [K in Key]?: Value
}