import type { RequireOne } from '@xaendar/types';

/**
 * How to find a user: by id, by email, or by both.
 */
type UserQuery = RequireOne<{
  /**
   * The id of the user.
   */
  id?: number;
  /**
   * The email of the user.
   */
  email?: string;
}>;

/**
 * Describes a query, for the log.
 *
 * @param query - The id, the email, or both.
 * @returns The description.
 */
function describeQuery(query: UserQuery): string {
  return query.id === undefined ? `email ${query.email}` : `id ${query.id}`;
}

describeQuery({ id: 42 });                             // ✓ 'id 42'
describeQuery({ email: 'ada@example.com' });           // ✓ 'email ada@example.com'
describeQuery({ id: 42, email: 'ada@example.com' });   // ✓ 'id 42'
describeQuery({});                                     // ✗ Argument of type '{}' is not assignable to parameter of type 'UserQuery'.
