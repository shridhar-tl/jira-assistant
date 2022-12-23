import { createContext, useContext, useEffect, useState } from "react";
import { inject } from "../services/injector-service";

function createStore(initialData = {}) {
    if (typeof initialData === 'function') {
        initialData = initialData(initialData);
    }
    const Context = createContext(initialData);
    const ContextProvider = Context.Provider;

    let setStoreData = function () {/* */ };
    let getStateValue = function () {/* */ };

    function subscribe(setter, getter) {
        setStoreData = setter;
        getStateValue = getter;
    }
    function dispatch(newState) { setStoreData(newState); }
    function getState(name) {
        const state = getStateValue();

        if (!state) { return; }

        return name ? state[name] : state;
    }

    function DataProvider({ children, initialData: value, ...otherProps }) {
        const [state, setState] = useState(() => ({ ...initialData, ...value, ...otherProps }));
        subscribe((changes) => setState(typeof changes === 'function' ? changes : (cur) => ({ ...cur, ...changes })), () => state);
        return (<ContextProvider value={state}>{children}</ContextProvider>);
    }

    function connect(Component, mapProps, actions, services) {
        if (actions) {
            actions = Object.keys(actions).reduce((obj, key) => {
                obj[key] = actions[key](dispatch, getState);
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

        return function (props) {
            const state = useContext(Context);
            const propsToPass = mapProps ? mapProps(state, props) : undefined;
            return (<Component {...propsToPass} {...props} {...actions} />);
        };
    }

    function withProvider(Component, mapProps, actions, services, init) {
        if (mapProps || actions) {
            Component = connect(Component, mapProps, actions, services);
        }

        if (!init) {
            return function (props) {
                return (<DataProvider><Component {...props} /></DataProvider>);
            };
        } else {
            return function (props) {
                const [ready, nowReady] = useState(false);
                const [data, setData] = useState(false);
                useEffect(() => {
                    (async function () {
                        let result = init();
                        if (result?.then) {
                            result = await result;
                        }
                        setData(result);
                        nowReady(true);
                    })();
                }, []);

                if (ready) {
                    return (<DataProvider initialData={data}><Component {...props} /></DataProvider>);
                } else {
                    return null;
                }
            };
        }
    }

    return { DataProvider, withProvider, connect };
}

export default createStore;