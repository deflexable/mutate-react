import { Children, cloneElement, createElement, forwardRef, isValidElement, memo, useEffect, useMemo, useRef, useReducer } from "react";

export default function MutateReact({ children, onHandleMutation, enableLocator }) {
    const instantDoHijack = useRef();
    instantDoHijack.current = onHandleMutation;

    const injectIntoTree = (node, path) => {
        if (!node) return node;
        if (Array.isArray(node)) {
            return Children.map(node, (v, i) => injectIntoTree(v, path && [...path, i]));
        }
        if (!isValidElement(node)) return node;

        if (path) path = [...path, getNodeId(node)];

        const thisObj = instantDoHijack.current?.(node, path);

        if (thisObj?.['@type'] === MutantSymbol) {
            return thisObj.__element;
        }

        if (!isHostElement(node)) {
            const wrapNodeType = (nodeType, pathway, pathKey, hotReloadObj) => {
                if (pathway) pathway = [...pathway, getNodeId(undefined, nodeType, pathKey)];

                const continueRendering = (renderedNode) => {
                    return injectIntoTree(renderedNode, pathway && [...pathway, 0]);
                }

                if (isClassComponent(nodeType)) {
                    class MutatedClass extends nodeType {
                        render() {
                            if (hotReloadObj?.hot) {
                                const family = getHotReload().getFamilyByType(nodeType);
                                const renderMethod = family?.current?.prototype?.render;

                                if (typeof renderMethod === 'function')
                                    return continueRendering(renderMethod.call(this));
                            }

                            return continueRendering(super.render());
                        }
                    }

                    const name = nodeType.displayName || nodeType.name;
                    if (name) MutatedClass.displayName = name;

                    return MutatedClass;
                } else if (typeof nodeType === 'function') { // check self closed tag
                    return hijackRender(nodeType, continueRendering, hotReloadObj);
                } else if (nodeType?.$$typeof === REACT_SYMBOLS.forwardRef) {
                    return forwardRef(hijackRender(nodeType.render, continueRendering, hotReloadObj));
                } else if (nodeType?.$$typeof === REACT_SYMBOLS.memo) {
                    const newType = memo(wrapNodeType(nodeType.type, pathway, undefined, hotReloadObj), nodeType.compare);
                    newType.displayName = nodeType.displayName || nodeType.name;
                    return newType;
                }
                return nodeType;
            }

            if (
                typeof node.type === 'function' || // check self closed tag
                node.type?.$$typeof === REACT_SYMBOLS.forwardRef || // check forwardRef
                node.type?.$$typeof === REACT_SYMBOLS.memo // check memo
            ) {
                return (
                    <__MutatedReactNode
                        node={node}
                        path={path}
                        wrapNodeType={wrapNodeType} />
                );
            }
        }

        const children = node.props?.children;
        if (children)
            return cloneElement(node, {
                children: injectIntoTree(children, path && [...path, 0])
            });

        return node;
    };

    return injectIntoTree(children, enableLocator ? [] : undefined);
};

const MutantSymbol = Symbol('ReactMutant');

export const createMutantElement = (element) =>
    ({ __element: element, '@type': MutantSymbol });

const REACT_SYMBOLS = {
    forwardRef: Symbol.for('react.forward_ref'),
    memo: Symbol.for('react.memo')
};

function __MutatedReactNode({ node, wrapNodeType, path }) {
    const wrappedObj =
        useMemo(() => {
            const hotReloadSession = {};
            return {
                type: wrapNodeType(node.type, path && path.slice(0, -1), node.key, hotReloadSession),
                reload: hotReloadSession
            };
        }, [node.type, node.key]);

    if (__DEV__) {
        const [_, forceRefresh] = useReducer(value => value + 1, 0);

        useEffect(() => {
            return listenHotRefresh(() => {
                const family = getHotReload().getFamilyByType(node.type);

                if (family && isNodeNotEqual(node.type, family.current)) {
                    wrappedObj.reload.hot = true;
                    forceRefresh();
                }
            });
        }, [wrappedObj]);
    }

    return createElement(
        wrappedObj.type,
        {
            ...node.props,
            key: node.key,
            ...(node.ref && !node.props?.ref) ? { ref: node.ref } : {}
        },
        node.props?.children
    );
}

const isNodeNotEqual = (nodeType, nodeType2) => {
    if (nodeType !== nodeType2) return true;

    if (typeof nodeType === 'function') {
        return false;
    } else if (nodeType?.$$typeof === REACT_SYMBOLS.forwardRef) {
        return nodeType.render !== nodeType2?.render;
    } else if (nodeType?.$$typeof === REACT_SYMBOLS.memo) {
        return isNodeNotEqual(nodeType.type, nodeType2?.type);
    }

    return false;
}

const hijackRender = (type, doHijack, o) =>
    new Proxy(type, {
        apply(target, thisArg, args) {
            if (o?.hot) {
                const family = getHotReload().getFamilyByType(type);
                if (family?.current) target = family.current;
            }

            const renderedNode = Reflect.apply(target, thisArg, args);
            return doHijack(renderedNode);
        }
    });

function getNodeId(node, typeObj, typeKey) {
    if ((!node && !typeObj) || (node && !isValidElement(node))) return `${node}`;

    const type = typeObj || node?.type;
    const withKey = (s) => `${s}:${[typeKey || node?.key].find(v => ![null, undefined].includes(v)) || null}`;
    const withWrapper = (tag, name) => `@${tag}#${name}#`;

    // Host component
    if (typeof type === 'string' || typeof type === 'number') return withKey(type);

    if (type?.displayName) return withKey(type.displayName);

    // Function component
    if (typeof type === "function") return withKey(type.name);

    if (type?.$$typeof === REACT_SYMBOLS.forwardRef) { // forwardRef
        return withKey(withWrapper('forwardRef', type.render?.name));
    } else if (type?.$$typeof === REACT_SYMBOLS.memo) { // memo
        return withKey(withWrapper('memo', ''));
    }

    return withKey(
        type?.name ||
        // node?.name ||
        withWrapper('Fragment', type?.$$typeof?.toString?.() || '')
    );
};

function isHostElement(node) {
    if (!node) return true;
    const t = typeof node.type;

    return (
        t === 'string' ||
        t === 'number' || // RN internal tags
        node?.type?.Context !== undefined ||
        (t !== 'function' && t !== 'object')
    );
};

function isClassComponent(type) {
    return (
        typeof type === 'function' &&
        type.prototype?.isReactComponent != null
    );
}

const getHotReload = () => {
    const runtimePath = `${globalThis.__METRO_GLOBAL_PREFIX__ || ''}__ReactRefresh`;
    return globalThis[runtimePath];
}

const listenHotRefresh = (callback) => {
    if (!globalThis.__reactMutationHotReloadMap) {
        const originalPerformReactRefresh = getHotReload()?.performReactRefresh;

        if (typeof originalPerformReactRefresh !== 'function') return () => false;

        getHotReload().performReactRefresh = function (...args) {
            const result = originalPerformReactRefresh.apply(this, args);

            try {
                globalThis.__reactMutationHotReloadMap.forEach(v => {
                    v();
                });
            } catch (error) {
                console.error('listenHotRefresh err:', error);
            }

            return result;
        }
        globalThis.__reactMutationHotReloadMap = new Map();
    }

    const ref = {};
    globalThis.__reactMutationHotReloadMap.set(ref, callback);

    return () => {
        if (!globalThis.__reactMutationHotReloadMap) return;

        const res = globalThis.__reactMutationHotReloadMap.delete(ref);

        if (!globalThis.__reactMutationHotReloadMap.size) {
            delete globalThis.__reactMutationHotReloadMap;
        }

        return res;
    }
}