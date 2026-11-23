import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import GroupableGrid from '../../components/GroupableGrid';
import { Link } from '../../controls';

import { flatGridSettingsChanged, getColumnSettings } from './actions';
import { connect } from './datastore';

const estimateFields = ['originalestimate', 'totalLogged', 'remainingestimate', 'estVariance'];

function getHiddenColumns(displayColumns: string[] | null | undefined, columnIds: string[]): string[] {
    if (!displayColumns) {
        return [];
    }
    if (displayColumns.some((c) => c.startsWith('-'))) {
        return displayColumns.filter((c) => c.startsWith('-')).map((c) => c.substring(1));
    }
    return columnIds.filter((id) => !displayColumns.includes(id));
}

function toDisplayColumns(hiddenColumns: string[]): string[] | null {
    return hiddenColumns.length ? [...new Set(hiddenColumns)].map((id) => `-${id}`) : null;
}

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
    getColumnSettings,
    flatGridSettingsChanged,
    onSettingsChanged,
}: ConnectedProps) {
    const [columns] = useState(() => getColumnSettings(formatTicket));
    const columnIds = useMemo<string[]>(() => columns.map((c: any) => c.id || c.field), [columns]);
    const { groupBy, groupFoldable, sortField, isDesc, displayColumns: savedColumns } = flatTableSettings || {};

    const displayColumns = useMemo(() => {
        const hidden = getHiddenColumns(savedColumns, columnIds);
        return toDisplayColumns(hideEstimate ? [...hidden, ...estimateFields] : hidden);
    }, [savedColumns, columnIds, hideEstimate]);

    const settingsChanged = useCallback(
        (settings: any) => {
            let hidden = getHiddenColumns(settings.displayColumns, columnIds);
            if (hideEstimate) {
                const savedEstimates = getHiddenColumns(savedColumns, columnIds).filter((id) => estimateFields.includes(id));
                hidden = [...hidden.filter((id) => !estimateFields.includes(id)), ...savedEstimates];
            }
            flatGridSettingsChanged({ ...settings, displayColumns: toDisplayColumns(hidden) });
        },
        [columnIds, hideEstimate, savedColumns, flatGridSettingsChanged],
    );
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
            onChange={settingsChanged}
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
