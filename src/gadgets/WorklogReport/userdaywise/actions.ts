export function toggleUserExpanded(setState: any, getState: any) {
    return function (boardId: string | undefined, groupIndex: number, uid: string) {
        const state = getState();
        const userExpnState = { ...state.userExpnState };
        const key = `${boardId}_${groupIndex}_${uid}`;
        const isExpanded = userExpnState[key];

        if (isExpanded ?? state.expandUsers) {
            userExpnState[key] = false;
        } else {
            userExpnState[key] = true;
        }

        setState({ userExpnState });
    };
}
