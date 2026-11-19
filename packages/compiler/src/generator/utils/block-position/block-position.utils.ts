import { ASTNodeType } from '../../../parser/types/node.enum';
import { GeneratorContext } from '../../context/context';
import type { BlockBranch } from '../../types/block-branch.type';
import type { GeneratorFunctionToProcess } from '../../types/generator-function-to-process.type';
import type { GeneratorTransitionFunctionReturnType } from '../../types/generator-transition-function-return-type.type';
import type { ASTNode } from '../../../parser/types/ast.type';
import type { CaseNode } from '../../../parser/types/nodes/case-node.type';
import type { ElseIfNode } from '../../../parser/types/nodes/else-if-node.type';
import type { ElseNode } from '../../../parser/types/nodes/else-node.type';
import type { IfNode } from '../../../parser/types/nodes/if-node.type';
import { isStructuralElement } from '../../../parser/utils/scope-declarations/scope-declarations.utils';
/**
 * Tells whether a node is the last one its parent renders: every sibling following it renders nothing (an `@import`, a
 * `<template>` declaration, a `@let`). A block in this position, when its parent ends where the node it is rendered into
 * does (the root of the template, the children of an element, the content of a block itself in this position), needs no
 * anchor: both generators read it here, the client to create none, the server to write no marker closing the block
 * (see `BlockPosition` of `@xaendar/core`).
 *
 * @example
 * isLastRenderedChild(parseTemplate('@if (a) { x } @let b = 1;'), 0); // true
 * isLastRenderedChild(parseTemplate('@if (a) { x } <p></p>'), 0);     // false
 *
 * @param siblings - The node and its siblings, in order.
 * @param index - The position of the node among them.
 * @returns `true` when no sibling following the node renders a node.
 */
export function isLastRenderedChild(siblings: readonly ASTNode[], index: number): boolean {
  for (let i = index + 1; i < siblings.length; i++) {
    switch (siblings[i].type) {
      case ASTNodeType.Import:
      case ASTNodeType.Template:
      case ASTNodeType.Let:
        break;

      default:
        return false;
    }
  }

  return true;
}

/**
 * Returns the anchor the functions rendering the content of a block forward to what they render: `anchor`, the node the
 * runtime renders the content before, or none for the last block of its parent, whose content is appended, the end of
 * the content being the end of the parent too, so that its own last block needs no anchor either.
 *
 * @param last - Whether the block is the last node of its parent (see {@link isLastRenderedChild}).
 * @returns The name of the anchor, `undefined` when the content renders at the end of the parent.
 */
export function getContentAnchor(last: boolean): string | undefined {
  return last ? undefined : 'anchor';
}

/**
 * Appends to the members of the constant of the module describing a block the one telling it is the last node of its
 * parent, which the runtime creates no anchor for, and the server closes with no marker (see `BlockPosition` of
 * `@xaendar/core`). It is left out otherwise. A block with an anchor at the top of the block of a runtime scope gets the
 * slot of its anchor in the scope (see `GeneratorContext.allocateNodeSlot`), given by the caller.
 *
 * @param members - The members of the constant.
 * @param last - Whether the block is the last node of its parent.
 * @param slot - The slot of the anchor of the block, `undefined` for a block whose anchor no scope tracks.
 */
export function appendBlockPosition(members: string[], last: boolean, slot?: number): void {
  if (last) {
    members.push('last: true');
  }

  if (slot !== undefined) {
    members.push(`slot: ${slot}`);
  }
}

/**
 * Gives a block of the client its slot, the one of its anchor, when it has one and the function rendering it tracks
 * the nodes at the top of its scope: the last block of its parent has no anchor.
 *
 * @param generatorContext - The generator context of the scope rendering the block.
 * @param last - Whether the block is the last node of its parent.
 * @returns The slot, `undefined` for a block whose anchor no scope tracks.
 */
export function allocateBlockSlot(generatorContext: GeneratorContext, last: boolean): number | undefined {
  return last ? undefined : generatorContext.allocateNodeSlot();
}

/**
 * Gives a block of the client its container in the runtime scope rendering it (see `GeneratorContext.allocateContainer`)
 * and writes its index into the constant of the block, unless it is the first one, the default of the runtime.
 *
 * @param members - The members of the constant of the block.
 * @param generatorContext - The scope rendering the block.
 */
export function appendContainer(members: string[], generatorContext: GeneratorContext): void {
  const container = generatorContext.allocateContainer();
  if (container) {
    members.push(`container: ${container}`);
  }
}

/**
 * Tells whether the content of a branch of an `@if` or of a `@switch` can be rendered inline into the runtime scope
 * holding the block, without a scope of its own (see `InlineBranch` of the runtime): it holds only texts, interpolations
 * and elements, its elements included, and declares no variable (no element ref, no `@let`, no template), renders no
 * block and applies no directive nor conditional binding, which keep their state in a scope or among its cleanups.
 *
 * @param nodes - The nodes of the branch.
 * @returns `true` when the branch can be rendered inline.
 */
export function rendersInline(nodes: readonly ASTNode[]): boolean {
  return nodes.every(rendersNodeInline);
}

/**
 * Describes a branch of an `@if` or of a `@switch` (see `GeneratorContext.declareBlock`) and the function rendering it:
 * a branch that can be rendered inline (see {@link rendersInline}) is generated in a context of kind `inline`, any other
 * one in a scope of its own.
 *
 * @param node - The node of the branch.
 * @param key - The name of the function rendering it.
 * @param members - What selects the branch (`condition: …`), if anything.
 * @param generatorContext - The scope rendering the block.
 * @param anchor - The name of the anchor the content is rendered before, `undefined` to append it.
 * @returns The description of the branch, and the function to generate.
 */
export function describeBranch(node: IfNode | ElseIfNode | ElseNode | CaseNode, key: string, members: string[], generatorContext: GeneratorContext, anchor: string | undefined): { branch: BlockBranch, fn: GeneratorFunctionToProcess } {
  members.push(`block: ${key}`);
  const inline = rendersInline(node.children);
  const context = new GeneratorContext(generatorContext, undefined, inline ? 'inline' : 'scope');
  return {
    branch: inline ? { members, context } : { members },
    fn: { fn: { node, parentNode: key, context, anchor }, args: [key, 'parentContext', 'anchor', 'nodeStrategy'] }
  };
}

/**
 * Adds a branch described by {@link describeBranch} to the ones of its block, and its function to the ones to generate.
 *
 * @param result - The result of the state generating the block, collecting the functions to generate.
 * @param branches - The branches of the block, in order.
 * @param described - The branch and its function.
 */
export function addBranch(result: GeneratorTransitionFunctionReturnType, branches: BlockBranch[], { branch, fn }: { branch: BlockBranch, fn: GeneratorFunctionToProcess }): void {
  branches.push(branch);
  result.functionsToProcess!.set(fn.args![0], fn);
}

/**
 * Tells whether a node of a branch can be rendered inline (see {@link rendersInline}).
 *
 * @param node - The node.
 * @returns `true` when it can.
 */
function rendersNodeInline(node: ASTNode): boolean {
  switch (node.type) {
    case ASTNodeType.Text:
    case ASTNodeType.Interpolation:
      return true;

    case ASTNodeType.Element:
      return !node.ref && !node.directives.length && !node.conditionalBindings.length && !isStructuralElement(node) && rendersInline(node.children);

    default:
      return false;
  }
}

/**
 * Tells whether nodes render a block holding a container of the runtime scope they are rendered in (`@if`, `@switch`,
 * `@for`, `@defer`, `@try`, `@hydrate`, `@client`, `@render`, an element structural directives are applied to), the
 * ones rendered into their elements included, which render their children in the same scope.
 *
 * @param nodes - The nodes.
 * @returns `true` when one of them renders a block.
 */
export function rendersBlock(nodes: readonly ASTNode[]): boolean {
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    switch (node.type) {
      case ASTNodeType.If:
      case ASTNodeType.Switch:
      case ASTNodeType.For:
      case ASTNodeType.Defer:
      case ASTNodeType.Try:
      case ASTNodeType.Hydrate:
      case ASTNodeType.Client:
      case ASTNodeType.Render:
        return true;

      case ASTNodeType.Element:
        if (isStructuralElement(node) || rendersBlock(node.children)) {
          return true;
        }

        break;
    }
  }

  return false;
}
