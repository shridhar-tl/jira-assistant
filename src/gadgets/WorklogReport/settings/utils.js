// ToDo: This is mutating the parameter object currently. Need to modify later
export function getFinalStateToSave(settings, modifiedSettings, allSettings) {
    const { reportLoaded, userListMode, timeframeType } = settings;

    if (reportLoaded) {
        // Clear the report
        modifiedSettings.reportLoaded =
            // when userListMode is changed
            (!modifiedSettings.userListMode || modifiedSettings.userListMode === userListMode)
            // or when timeframeType is changed
            && (!modifiedSettings.timeframeType || modifiedSettings.timeframeType === timeframeType)
            ;
    }

    // Clear the selSprints object when corresponding board is removed
    const { sprintBoards, selSprints } = allSettings;
    const selectedBoards = sprintBoards?.reduce((obj, cur) => {
        obj[cur.id] = true;
        return obj;
    }, {}) || {};
    const keysToDel = Object.keys(selSprints).filter(k => !selectedBoards[k]);

    if (keysToDel.length) {
        const newSelSprints = { ...allSettings.selSprints };
        keysToDel.forEach(k => delete newSelSprints[k]);
        modifiedSettings.selSprints = newSelSprints;
        allSettings.selSprints = newSelSprints;
    }

    return allSettings;
}