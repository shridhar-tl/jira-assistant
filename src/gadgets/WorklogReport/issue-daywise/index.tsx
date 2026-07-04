import React, { useMemo } from 'react';

import { ScrollableTable } from '../../../components/shared';
import { getComponentFor } from '../../../display-controls';
import { useWorklogStore } from '../datastore';

import GroupBody from './GroupBody';
import GroupHead from './GroupHead';

const worklogAuthorField = { key: 'worklogUser', type: 'user', name: 'Worklog author' };
const logDateTime = { key: 'logDateTime', type: 'datetime', name: 'Worklog date' };

interface IssueDayWiseGridProps {
    boardId?: string;
    exportSheetName: string;
    costView?: boolean;
}

export default function IssueDayWiseGrid({ boardId, exportSheetName, costView }: IssueDayWiseGridProps) {
    const { splitWorklogDays, fields } = useWorklogStore();
    const { optional, daywiseFields } = fields || {};

    const additionalCols = useMemo(() => {
        const cols = [worklogAuthorField, ...(optional?.filter((f: any) => daywiseFields?.[f.id]) ?? [])];

        if (splitWorklogDays) {
            cols.splice(0, 0, logDateTime);
        }

        return cols.map((f: any) => {
            return { ...f, ...getComponentFor(f.type) };
        });
    }, [optional, daywiseFields, splitWorklogDays]);

    return (
        <ScrollableTable className="table-bordered" exportSheetName={exportSheetName}>
            <GroupHead additionalCols={additionalCols} boardId={boardId} />
            <GroupBody additionalCols={additionalCols} boardId={boardId} costView={costView} />
        </ScrollableTable>
    );
}
