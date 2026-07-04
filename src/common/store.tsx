import { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';

import { inject } from '../services/injector';

type Dispatch = (newState: any) => void;
type GetState = (name?: string) => any;

interface StoreActions {
    [key: string]: (dispatch: Dispatch, getState: GetState) => any;
}

interface StoreContextValue<T> {
    state: T;
    dispatch: Dispatch;
    getState: GetState;
}

function createStore<T extends Record<string, any>>(initialData?: T | (() => T)) {
    if (typeof initialData === 'function') {
        initialData = initialData();
    }
    if (!initialData) {
        initialData = {} as T;
    }

    // Context carries both state AND the dispatch/getState functions scoped to each instance
    const Context = createContext<StoreContextValue<T>>({
        state: initialData as T,
        dispatch: () => { /* */ },
        getState: () => initialData as T,
    });

    interface DataProviderProps {
        children: ReactNode;
        initialData?: Partial<T>;
        [key: string]: any;
    }

    function DataProvider({ children, initialData: value, ...otherProps }: DataProviderProps) {
        const [state, setStateRaw] = useState<T>(() => ({ ...initialData, ...value, ...otherProps }) as T);

        // Keep a ref to the latest state so getState() always returns current value
        const stateRef = useRef(state);
        stateRef.current = state;

        // These are stable functions scoped to this provider instance
        const dispatchRef = useRef<Dispatch>((changes: any) => {
            setStateRaw(typeof changes === 'function' ? changes : (cur: T) => ({ ...cur, ...changes }));
        });

        const getStateRef = useRef<GetState>((name?: keyof T) => {
            const s = stateRef.current;
            return name ? s[name] : s;
        });

        const ctxValue: StoreContextValue<T> = {
            state,
            dispatch: dispatchRef.current,
            getState: getStateRef.current,
        };

        return <Context.Provider value={ctxValue}>{children}</Context.Provider>;
    }

    function connect(
        Component: React.ComponentType<any>,
        mapProps?: (state: T, props: any) => any,
        actions?: StoreActions,
        services?: string[] | [...string[], (svc: any) => any],
    ) {
        return function ConnectedComponent(props: any) {
            const { state, dispatch, getState } = useContext(Context);

            let computedActions: any = {};
            if (actions) {
                computedActions = Object.keys(actions).reduce((obj: any, key: string) => {
                    obj[key] = actions[key](dispatch, getState);
                    return obj;
                }, {});
            }

            if (services && services.length) {
                const func = services[services.length - 1];
                if (typeof func === 'function') {
                    const svc = inject(...(services.slice(0, services.length - 1) as string[]));
                    computedActions = { ...computedActions, ...func(svc) };
                } else {
                    const svc = inject(...(services as string[]));
                    computedActions = { ...computedActions, ...svc };
                }
            }

            const propsToPass = mapProps ? mapProps(state, props) : undefined;
            return <Component {...propsToPass} {...props} {...computedActions} />;
        };
    }

    function useStore(): T {
        return useContext(Context).state;
    }

    function useDispatch(): Dispatch {
        return useContext(Context).dispatch;
    }

    function useGetState(): GetState {
        return useContext(Context).getState;
    }

    function withProvider(
        Component: React.ComponentType<any>,
        mapProps?: (state: T, props: any) => any,
        actions?: StoreActions,
        services?: string[] | [...string[], (svc: any) => any],
        init?: (props: any) => T | Promise<T>,
    ) {
        let WrappedComponent = Component;

        if (mapProps || actions) {
            WrappedComponent = connect(Component, mapProps, actions, services);
        }

        if (!init) {
            return function (props: any) {
                return (
                    <DataProvider>
                        <WrappedComponent {...props} />
                    </DataProvider>
                );
            };
        } else {
            return function (props: any) {
                const [ready, nowReady] = useState(false);
                const [data, setData] = useState<Partial<T> | false>(false);
                useEffect(() => {
                    (async function () {
                        let result: any = init(props);
                        if (result?.then) {
                            result = await result;
                        }
                        setData(result);
                        nowReady(true);
                    })();
                }, []); // eslint-disable-line react-hooks/exhaustive-deps

                if (ready) {
                    return (
                        <DataProvider initialData={data as Partial<T>}>
                            <WrappedComponent {...props} />
                        </DataProvider>
                    );
                } else {
                    return null;
                }
            };
        }
    }

    return { DataProvider, withProvider, connect, useStore, useDispatch, useGetState, Context };
}

export default createStore;
