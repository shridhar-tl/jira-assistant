import React from "react";
import { createWithEqualityFn } from 'zustand/traditional';
import { shallow } from 'zustand/shallow';
import { inject } from "../services/injector-service";

function createStore(initialData = {}) {
    if (typeof initialData !== 'function') {
        const data = initialData ?? {};
        initialData = () => data;
    }

    const useStateStore = createWithEqualityFn(initialData);

    const setStoreState = (partial, replace) => useStateStore.setState(partial, replace);
    const getStoreState = (args) => {
        const state = useStateStore.getState();
        if (!args) {
            return state;
        }

        if (typeof args === 'string') {
            return state[args];
        } else if (typeof args === 'function') {
            return args(state);
        }
    };

    function connect(Component, mapProps, actions, services) {
        if (actions) {
            actions = Object.keys(actions).reduce((obj, key) => {
                obj[key] = actions[key](setStoreState, getStoreState);
                return obj;
            }, {});
        } else {
            actions = {};
        }

        if (services && services.length) {
            const func = services[services.length - 1];
            if (typeof func === 'function') {
                const svc = inject(services.slice(0, services.length - 1));
                actions = { ...actions, ...func(svc) };
            } else {
                const svc = inject(services);
                actions = { ...actions, ...svc };
            }
        }

        if (!mapProps) {
            return function (props) {
                return (<Component {...props} {...actions} />);
            };
        }

        return function (props) {
            const propsToPass = useStateStore(state => mapProps(state, { ...props, ...actions }), shallow);

            return (<Component {...propsToPass} {...props} {...actions} />);
        };
    }

    function withProvider(Component, mapProps, actions, services, init) {
        if (mapProps || actions) {
            Component = connect(Component, mapProps, actions, services);
        }

        if (!init) {
            return Component;
        } else {
            return function (props) {
                const [ready, nowReady] = React.useState(false);

                React.useEffect(() => {
                    (async function () {
                        let result = init(props);
                        if (result?.then) {
                            result = await result;
                        }
                        setStoreState(result);
                        nowReady(true);
                    })();
                }, []); // eslint-disable-line react-hooks/exhaustive-deps

                if (ready) {
                    return (<Component {...props} />);
                } else {
                    return null;
                }
            };
        }
    }

    return { useStateStore, withProvider, connect };
}

export default createStore;