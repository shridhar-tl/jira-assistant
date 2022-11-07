import { createContext, useContext, useState } from "react";
import { useNavigate } from "react-router-dom";

const PokerContext = createContext({});
const PokerContextProvider = PokerContext.Provider;

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

const initialData = {
    hasExtensionSupport: false,
    roomId: '',
    sid: '',
    created: 0,
    currentIssueId: null,
    viewingIssueId: null,
    lastActivity: 0,
    timer: 0,
    waitingRoom: false,
    moderatorId: '',
    members: [],
    issues: [], issuesMap: {},
    votes: [], votesMap: {},
    autoReveal: false,
    showHalfScore: true,
    maxPoints: 89,
    showConfigs: false
};

const PokerDataStore = function ({ children, ...otherProps }) {
    const [state, setState] = useState(() => ({ ...initialData, ...otherProps }));
    subscribe((changes) => setState((cur) => ({ ...cur, ...changes })), () => state);
    return (<PokerContextProvider value={state}>{children}</PokerContextProvider>);
};

const connect = function (Component, mapProps, actions) {
    if (actions) {
        actions = Object.keys(actions).reduce((obj, key) => {
            obj[key] = actions[key](dispatch, getState);
            return obj;
        }, {});
    } else {
        actions = {};
    }

    return function (props) {
        const navigate = useNavigate();
        const state = useContext(PokerContext);
        const propsToPass = mapProps ? mapProps(state, props) : undefined;
        return (<Component {...propsToPass} {...props} {...actions} navigate={navigate} />);
    };
};

export { PokerDataStore, connect };
