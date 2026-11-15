import type { Function, VoidFunction } from '@xaendar/types';
import type { AttributeNode } from '../../types/nodes/attribute-node.type';
import type { ConditionalBindingBranchNode } from '../../types/nodes/conditional-binding-branch-node.type';
import type { ConditionalBindingNode } from '../../types/nodes/conditional-binding-node.type';

/**
 * Ensures every attribute/property is bound at most once at a time on an element or on a directive,
 * across the element (or the directive) itself and all of its (nested) conditional bindings.
 *
 * A conditional binding cannot share an attribute with its owner or with
 * another conditional binding: when its selected branch changes the runtime
 * unbinds the attribute (removing it or restoring the property's default),
 * which would clobber the value set by the other binding.
 * The branches of a conditional binding can instead bind the same attribute,
 * since only one of them is applied at a time.
 * Events are not checked, since an element may listen to the same event more than once.
 *
 * Two attributes count as the same one when they have the same key: the parser tells apart `title` and `attr.title` on a
 * custom element, whose `title` may be an input, while the type-check, knowing the inputs, counts them as one when
 * `title` is not an input.
 *
 * @param attributes - Attribute nodes to check.
 * @param conditionalBindings - Conditional bindings whose attributes are checked recursively.
 * @param keyOf - Gives what an attribute binds: two attributes with the same key are the same one.
 * @param describeDuplicate - Builds the error message for an attribute bound more than once, given its key.
 * @param bound - Keys of the attributes already bound on the owner.
 * @throws If an attribute is bound more than once.
 */
export function assertUniqueAttributes(attributes: AttributeNode[], conditionalBindings: ConditionalBindingNode[], keyOf: Function<[attribute: AttributeNode], string>, describeDuplicate: Function<[key: string], string>, bound = new Set<string>()): void {
  for (let i = 0; i < attributes.length; i++) {
    const key = keyOf(attributes[i]);
    if (bound.has(key)) {
      throw new Error(describeDuplicate(key), { cause: attributes[i].span });
    }

    bound.add(key);
  }

  assertUniqueInBranches(conditionalBindings, bound, (branch, boundInBranch) => assertUniqueAttributes(branch.attributes, branch.conditionalBindings, keyOf, describeDuplicate, boundInBranch));
}

/**
 * Runs a uniqueness check on every branch of a list of conditional bindings.
 *
 * The branches of a conditional binding are mutually exclusive, so they can declare the same names.
 * Each branch is therefore checked against its own copy of the names declared so far: only once all the
 * branches of a conditional binding have been checked the names they declare are added to the given ones,
 * so that the following conditional bindings cannot declare them again.
 *
 * @param conditionalBindings - The conditional bindings whose branches are checked.
 * @param declared - The names declared so far, updated with the ones declared by the branches.
 * @param assertUnique - Checks a branch against the given names, adding to them the ones the branch declares.
 */
export function assertUniqueInBranches(conditionalBindings: ConditionalBindingNode[], declared: Set<string>, assertUnique: VoidFunction<[branch: ConditionalBindingBranchNode, declared: Set<string>]>): void {
  for (let i = 0; i < conditionalBindings.length; i++) {
    const { branches } = conditionalBindings[i];
    const declaredInBranches = new Set<string>();

    for (let j = 0; j < branches.length; j++) {
      const declaredInBranch = new Set(declared);
      assertUnique(branches[j], declaredInBranch);
      for (const name of declaredInBranch) {
        declaredInBranches.add(name);
      }
    }

    for (const name of declaredInBranches) {
      declared.add(name);
    }
  }
}
