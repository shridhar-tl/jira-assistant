export function setWorkSpace(setState, getState) {
    return function (workspace) {
        let settings = getState('settings');
        settings = { ...settings, workspace };
        setState({ settings });
    };
}

export function setCalendar(setState, getState) {
    return function (value, field) {
        let settings = getState('settings');
        settings = { ...settings, [field]: value };
        setState({ settings });
    };
}