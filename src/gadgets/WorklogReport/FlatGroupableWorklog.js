import React, { useState } from 'react';
import GroupableGrid from '../../components/GroupableGrid/GroupableGrid';
import { connect } from "./datastore";
import { getColumnSettings, flatGridSettingsChanged } from './actions';
import Link from '../../controls/Link';

const estimateFieldsToBeHidden = ["-originalestimate", "-totalLogged", "-remainingestimate", "-estVariance"];
const formatTicket = (text, url) => text && <Link href={url} className="link">{text}</Link>;

function FlatGroupableWorklog({
    exportSheetName,
    getColumnSettings,
    flatGridSettingsChanged,
    flatWorklogs,
    hideEstimate,
    flatTableSettings: {
        groupBy, groupFoldable, displayColumns, sortField, isDesc
    } = { displayColumns: hideEstimate ? estimateFieldsToBeHidden : null }
}) {
    const [columns] = useState(() => getColumnSettings(formatTicket));

    if (!columns || !flatWorklogs) { return null; }

    return (<GroupableGrid className="flat-data-grid" dataset={flatWorklogs} exportSheetName={exportSheetName}
        columns={columns} allowSorting={true} onChange={flatGridSettingsChanged}
        displayColumns={displayColumns} groupBy={groupBy} groupFoldable={groupFoldable} sortField={sortField} isDesc={isDesc}
        noRowsMessage="No worklog details available"
    />);
}

export default connect(FlatGroupableWorklog,
    (state, { boardId }) => {
        const {
            [boardId ? `flatWorklogs_${boardId}` : 'flatWorklogs']: flatWorklogs,
            fields: { hideEstimate }, flatTableSettings } = state;

        return ({ flatWorklogs, hideEstimate, flatTableSettings });
    },
    { getColumnSettings, flatGridSettingsChanged });
