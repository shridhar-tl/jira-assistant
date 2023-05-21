export function toggleUserExpanded(setState, getState) {
    return function (boardId, groupIndex, uid) {
        const state = getState();
        const userExpnState = { ...state.userExpnState };
        const key = `${boardId}_${groupIndex}_${uid}`;
        const { [key]: isExpanded } = userExpnState;

        if (isExpanded ?? state.expandUsers) {
            userExpnState[key] = false;
        } else {
            userExpnState[key] = true;
        }

        setState({ userExpnState });
    };
}