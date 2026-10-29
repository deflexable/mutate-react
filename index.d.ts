import type { ReactElement, ReactNode } from 'react';

/**
 * A path identifying a node's position in the traversed React tree.
 */
export type MutationPath = Array<string | number>;

/**
 * The result returned by a mutation handler.
 *
 * The `__element` property contains the element to use as the
 * mutation result. A value of `null` represents no element.
 */
export interface MutantElement {
  __element: ReactElement | null;
  '@type': symbol;
}

/**
 * Handles a node encountered during React tree traversal.
 *
 * Return `undefined` to leave the current node unchanged and
 * allow traversal to continue.
 *
 * Return `createMutantElement(element)` to provide an explicit
 * mutation result and control traversal according to the
 * library's mutation behavior.
 *
 * @param node - The current React node being inspected.
 * @param path - The node's location when locator tracking is
 * enabled; otherwise, `undefined`.
 * @returns A mutation result, or `undefined` to continue traversal.
 */
export type MutationHandler = (
  node: ReactNode,
  path: MutationPath | undefined
) => MutantElement | undefined;

/**
 * Props accepted by the MutateReact component.
 */
export interface MutationProps {
  /**
   * Callback invoked for nodes encountered during traversal.
   */
  onHandleMutation: MutationHandler;

  /**
   * Enables node location tracking.
   *
   * When enabled, the callback receives a path describing
   * the current node's location in the traversed tree.
   *
   * @default false
   */
  enableLocator?: boolean;

  /**
   * The React node tree to traverse and mutate.
   */
  children?: ReactNode;
}

/**
 * Traverses a React node tree and applies mutations returned
 * by the supplied handler.
 *
 * @param props - Traversal and mutation options.
 * @returns The resulting React element, or `null`.
 */
export default function MutateReact(
  props: MutationProps
): ReactElement | null;

/**
 * Creates a mutation result recognized by MutateReact.
 *
 * @param element - The element to return as the mutation result.
 * @returns A mutation result containing the supplied element.
 */
export function createMutantElement(
  element?: ReactElement | null
): MutantElement;