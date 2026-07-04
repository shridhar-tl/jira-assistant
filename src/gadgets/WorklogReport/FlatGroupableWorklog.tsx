import { useEffect, useRef, useState } from 'react';

import GroupableGrid from '../../components/GroupableGrid';
import { Link } from '../../controls';

import { flatGridSettingsChanged, getColumnSettings } from './actions';
import { connect } from './datastore';

const estimateFieldsToBeHidden = ['-originalestimate', '-totalLogged', '-remainingestimate', '-estVariance'];
const formatTicket = (text: string, url: string) =>
    text && (
        <Link href={url} className="link">
            {text}
        </Link>
    );

interface FlatGroupableWorklogProps {
    exportSheetName: string;
    boardId?: string;
    onSettingsChanged?: () => void;
}

interface ConnectedProps extends FlatGroupableWorklogProps {
    flatWorklogs: any[];
    hideEstimate: boolean;
    flatTableSettings: any;
    getColumnSettings: (formatTicket: any) => any[];
    flatGridSettingsChanged: (settings: any) => void;
}

function FlatGroupableWorklog({
    exportSheetName,
    flatWorklogs,
    hideEstimate,
    flatTableSettings,
    flatTableSettings: { groupBy, groupFoldable, displayColumns, sortField, isDesc } = {
        displayColumns: hideEstimate ? estimateFieldsToBeHidden : null,
    } as any,
    getColumnSettings,
    flatGridSettingsChanged,
    onSettingsChanged,
}: ConnectedProps) {
    const [columns] = useState(() => getColumnSettings(formatTicket));
    const ref = useRef(false);

    useEffect(() => {
        if (flatTableSettings && ref.current) {
            onSettingsChanged?.();
        }
        ref.current = true;
    }, [flatTableSettings]); // eslint-disable-line react-hooks/exhaustive-deps

    if (!columns || !flatWorklogs) {
        return null;
    }

    return (
        <GroupableGrid
            className="flat-data-grid"
            dataset={flatWorklogs}
            exportSheetName={exportSheetName}
            columns={columns}
            allowSorting={true}
            onChange={flatGridSettingsChanged}
            displayColumns={displayColumns}
            groupBy={groupBy}
            groupFoldable={groupFoldable}
            sortField={sortField}
            isDesc={isDesc}
            noRowsMessage="No worklog details available"
        />
    );
}

export default connect(
    FlatGroupableWorklog,
    (state: any, { boardId }: FlatGroupableWorklogProps) => {
        const flatWorklogs = boardId ? state[`flatWorklogs_${boardId}`] : state.flatWorklogs;
        const hideEstimate = state.fields?.hideEstimate;
        const { flatTableSettings } = state;
        return { flatWorklogs, hideEstimate, flatTableSettings };
    },
    { getColumnSettings, flatGridSettingsChanged },
);
