/**
 * The number of slots of the header of a runtime scope, the slot of its first variable (see `_Context` of
 * `@xaendar/core`, whose `HEADER` holds the same number): the variables of a scope follow it, then its nodes. Change both
 * together.
 */
export const SCOPE_HEADER = 8;
