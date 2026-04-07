export type ContainsChar<
  String extends string,
  Contains extends string
> =
  String extends `${infer First}${infer Rest}`
    ? First extends Contains
      ? true
      : ContainsChar<Rest, Contains>
    : false;
