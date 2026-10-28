# mutate-react
Mutate react component

Ultra fast and lite weight react component mutation library. Mutate dynamically deeply nested react components.

## Example Usage

```js
import { cloneElement } from "react";
import MutateReact, { createMutantElement } from "mutate-react";

const mutantResult =
    <MutateReact
        onHandleMutation={node => {
            const props = node?.props || {};

            if (isNodeTagName('SampleNode1')) {
                // provide prop for node
                const newNode = cloneElement(node, { ...props, title: 'Top Anime List' });

                return createMutantElement(newNode);
            }

            if (isNodeTagName('SampleNode2')) {
                const newNode =
                    cloneElement(node, {
                        ...props,
                        list: [
                            'Attack on Titan',
                            'One Piece',
                            'Re:Zero',
                            'Solo leveling'
                        ]
                    });

                return createMutantElement(newNode);
            }

            if (isNodeTagName('a')) {
                if (['http://link-one.com', 'http://link-two.com'].includes(props?.href)) {
                    return createMutantElement(
                        <div>
                            {'REMOVED_LINK: ' + props.children}
                        </div>
                    );
                }
            }

            // returning anything other than createMutantElement will be ignore and signals continuation of the node transversion

            // or to stop transversing this current particular node, you can return this:
            return createMutantElement(node); // this stops this node transversion and return it the way it is
        }}>
        <div>
            <SampleNode1 />
            <SampleNode2 />
            <NestSampleNode />
        </div>
    </MutateReact>;


function isNodeTagName (node, tagName) {
    return node?.type?.displayName === tagName || node?.type?.name === tagName;
}


// after rendering mutantResult, the node show display something similar to this:

<div>
    <h1>Top Anime List</h1>
    <ul>
        <li>Attack on Titan</li>
        <li>One Piece</li>
        <li>Re:Zero</li>
        <li>Solo leveling</li>
    </ul>
    <div>
        <span>
            <div>REMOVED_LINK: Link One</div>
            <div>REMOVED_LINK: Link Two</div>
            <a href="http://link-three.com">Link Three</a>
        </span>
    </div>
</div>


function SampleNode1({ title }) {
    return <h1>{title}</h1>
}

function SampleNode2({ list = [] }) {
    return (
        <ul>
            {list.map(v =>
                <li key={v}>{v}</li>
            )}
        </ul>
    );
}

function NestSampleNode() {
    return (
        <div>
            <span>
                <a href="http://link-one.com">Link One</a>
                <a href="http://link-two.com">Link Two</a>
                <a href="http://link-three.com">Link Three</a>
            </span>
        </div>
    );
}
```