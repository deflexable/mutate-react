# mutate-react

**Inspect, modify, and replace React elements throughout a component tree.**

`mutate-react` is a lightweight React library for traversing nested component trees and selectively modifying their elements. You can update props, replace elements, or stop traversal at a specific node.

## Features

- **Deep traversal:** Inspect nested React elements, including the output of components that render other components.
- **Selective mutation:** Target elements by component type, props, or any custom condition.
- **Element replacement:** Replace an existing element with a completely different element.
- **Traversal control:** Choose whether to continue traversing a node's descendants or preserve the node as-is.
- **Optional location tracking:** Enable `enableLocator` to receive the path of each node.
- **Lightweight API:** A small component and helper function.

## Installation

```bash
npm install mutate-react
```

or

```bash
yarn add mutate-react
```

## Quick start

Suppose you have a component tree and want to change the `title` prop of a particular component without modifying its original implementation.

```jsx
import React, { cloneElement } from 'react';
import MutateReact, { createMutantElement } from 'mutate-react';

function Page() {
  return (
    <MutateReact
      onHandleMutation={(node) => {
        if (!React.isValidElement(node)) {
          return;
        }

        if (node.type?.name === 'Welcome') {
          return createMutantElement(
            cloneElement(node, { title: 'Hello, world!' })
          );
        }
      }}
    >
      <div>
        <Welcome title="Welcome!" />
      </div>
    </MutateReact>
  );
}

function Welcome({ title }) {
  return <h1>{title}</h1>;
}
```

When the `Welcome` element is matched, the library replaces it with a cloned element whose `title` prop is `"Hello, world!"`.

**Note:** Checking `node.type.name` works for many function components, but it is not a reliable universal identifier. For production use, consider matching a component reference or another stable property.

## How it works

The library uses two main APIs:

- `MutateReact`: traverses the supplied React node tree and calls your mutation handler.
- `createMutantElement()`: marks an element as the result of a mutation and lets you control traversal.

Your callback can return one of two kinds of results.

### 1. Continue traversing

Return `undefined` when you do not want to replace the current node and want traversal to continue.

```jsx
<MutateReact
  onHandleMutation={(node) => {
    if (!React.isValidElement(node)) {
      return;
    }

    // Inspect the node here.
    // Returning undefined allows traversal to continue.
  }}
>
  {children}
</MutateReact>
```

This is useful when you want to find and modify components nested several levels deep.

### 2. Replace a node or stop traversal

Return `createMutantElement(element)` to explicitly handle the current node.

To replace a node, provide a different element:

```jsx
<MutateReact
  onHandleMutation={(node) => {
    if (!React.isValidElement(node)) {
      return;
    }

    if (node.type === OldComponent) {
      return createMutantElement(<NewComponent />);
    }
  }}
>
  {children}
</MutateReact>
```

To preserve a matched node without traversing its descendants, return the node itself:

```jsx
<MutateReact
  onHandleMutation={(node) => {
    if (!React.isValidElement(node)) {
      return;
    }

    if (node.type === ProtectedComponent) {
      return createMutantElement(node);
    }
  }}
>
  {children}
</MutateReact>
```

This is useful when you want to leave an entire subtree untouched.

### 3. Modify props

Use React's `cloneElement()` to preserve an element while changing its props.

```jsx
import React, { cloneElement } from 'react';
import MutateReact, { createMutantElement } from 'mutate-react';

function MutatedTree({ children }) {
  return (
    <MutateReact
      onHandleMutation={(node) => {
        if (
          React.isValidElement(node) &&
          node.type === Button
        ) {
          return createMutantElement(
            cloneElement(node, {
              disabled: true,
            })
          );
        }
      }}
    >
      {children}
    </MutateReact>
  );
}
```

This example disables matched `Button` elements without changing the original component definition.

## Tracking element locations

Set `enableLocator` to `true` to receive a path alongside each node.

```jsx
<MutateReact
  enableLocator
  onHandleMutation={(node, path) => {
    console.log('Node:', node);
    console.log('Path:', path);
  }}
>
  {children}
</MutateReact>
```

The path is an array of strings and numbers representing the node's location in the traversed tree.

When `enableLocator` is disabled or omitted, `path` is `undefined`.

Use the locator when debugging deeply nested trees or identifying where a particular element appears.

## API reference

### `MutateReact`

The component responsible for traversing and mutating the supplied node tree.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `children` | `ReactNode` | `undefined` | The node tree to traverse. |
| `onHandleMutation` | `(node, path) => MutantElement \| undefined` | Required | Callback invoked for nodes during traversal. |
| `enableLocator` | `boolean` | `false` | Enables node path tracking. |

### `onHandleMutation(node, path)`

Called for each node examined during traversal.

**Parameters**

- `node`: The current `ReactNode`.
- `path`: The node's location when `enableLocator` is enabled; otherwise, `undefined`.

**Return value**

- `undefined`: Do not replace the current node; continue traversal.
- `createMutantElement(element)`: Return an explicit mutation result and control traversal at the current node.

The exact traversal behavior depends on the library's mutation implementation. In particular, a replacement should not be assumed to have its descendants traversed unless the implementation explicitly supports that behavior.

### `createMutantElement(element?)`

Creates a mutation result that the traversal handler recognizes.

```ts
createMutantElement(element?: ReactElement | null): MutantElement
```

| Argument | Description |
| --- | --- |
| `element` | The element to return as the mutation result. May be omitted or `null`. |

**Example**

```jsx
return createMutantElement(
  <div className="replacement">Replaced</div>
);
```

## More Practical Example

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

            // Returning anything other than createMutantElement() is ignored, and traversal continues into the node's descendants.

            // or to stop traversing this current particular node, you can return this: `createMutantElement(node)`
            // this stops this node transversion and return it the way it is
        }}>
        <div>
            <SampleNode1 />
            <SampleNode2 />
            <NestSampleNode />
        </div>
    </MutateReact>;

function isNodeTagName(node, tagName) {
    return node?.type?.displayName === tagName || node?.type?.name === tagName;
}

// after rendering mutantResult, the node should display something similar to this:

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

## License

[MIT](LICENSE)