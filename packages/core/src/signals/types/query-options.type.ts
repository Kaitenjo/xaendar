import type { QueryRead } from './query-read.type';

/**
 * Options of the queries holding a single element: `@Query`, `@Query.required`, `@Query.ref`, `@Query.refRequired`,
 * and, together with the options of the content, `@Query.content` and `@Query.contentRequired`.
 */
export type QueryOptions = {
  /**
   * What the query holds for the element it finds: the element itself, `'element'`, or the instance of a custom
   * directive applied to it, by its class. By default the element, or the instance of the directive when the target
   * is the class of a directive.
   */
  read?: QueryRead;
};
