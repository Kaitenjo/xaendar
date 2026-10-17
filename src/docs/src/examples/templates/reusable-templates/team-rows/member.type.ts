/**
 * A member of the team.
 */
export type Member = {
  /**
   * The identifier of the member, which the rows are tracked by.
   */
  readonly id: number;
  /**
   * The name of the member.
   */
  readonly name: string;
  /**
   * The role of the member.
   */
  readonly role: string;
};
