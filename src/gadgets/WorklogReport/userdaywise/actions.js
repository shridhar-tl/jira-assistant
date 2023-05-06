export function toggleUserExpanded(setState, getState) {
    return function (boardId, groupIndex, uid) {
        const userExpnState = { ...getState('userExpnState') };
        const key = `${boardId}_${groupIndex}_${uid}`;
        const { [key]: isExpanded } = userExpnState;

        if (isExpanded) {
            delete userExpnState[key];
        } else {
            userExpnState[key] = true;
        }

        setState({ userExpnState });
    };
}