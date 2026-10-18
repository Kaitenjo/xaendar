import type { Beautify, RequireOne } from '@xaendar/types';

/**
 * The fields of every record.
 */
type Entity = {
  /**
   * The unique identifier.
   */
  id: number;
};

/**
 * A user. Hover: Entity & { name: string; }
 */
type User = Entity & {
  /**
   * The name shown to the others.
   */
  name: string;
};

/**
 * The same type. Hover: { id: number; name: string; }
 */
type FlatUser = Beautify<User>;

/**
 * A union is flattened member by member.
 * Hover: { id: number; name?: string | undefined; } | { name: string; id?: number | undefined; }
 */
type UserQuery = Beautify<RequireOne<Partial<FlatUser>>>;
