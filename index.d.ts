import { ReactNode, ReactElement } from "react";

interface MutationProps {
    /**
     * handle react component mutation, we transverse the entire node hirachy including dynamic renders.
     * 
     * return an instance of createMutantElement() to mutate each node instance.
     * 
     * @param node the react node to be mutated
     * @param path path to location of the react node, this always be undefined if `enableLocator={false}`
     * 
     * @returns {MutantElement | undefined}
     */
    onHandleMutation: (node: ReactNode, path: Array<string | number> | undefined) => MutantElement | undefined;
    /**
     * set to `true` to know where a certain node come from, this emit a path in `onHandleMutation`
     */
    enableLocator?: boolean | undefined;
    /**
     * node children to be mutated
     */
    children?: ReactNode;
}

interface MutantElement {
    __element: ReactElement | null;
}

export default function MutateReact(props: MutationProps): ReactElement | null;

export function createMutantElement(element?: ReactElement | null): MutantElement;