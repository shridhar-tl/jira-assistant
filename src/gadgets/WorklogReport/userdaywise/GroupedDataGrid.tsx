import React, { useMemo } from 'react';

import { ScrollableTable } from '../../../components/shared';
import { getComponentFor, normalizeType } from '../../../display-controls';
import { useWorklogStore } from '../datastore';

import GroupBody from './GroupBody';
import GroupHead from './GroupHead';

interface GroupedDataGridProps {
    boardId?: string;
    exportSheetName: string;
    costView?: boolean;
}

export default function GroupedDataGrid({ boardId, exportSheetName, costView }: GroupedDataGridProps) {
    const { fields } = useWorklogStore();
    const { optional, daywiseFields } = fields || {};

    const additionalCols = useMemo(
        () =>
            optional
                ?.filter((f: any) => daywiseFields?.[f.id])
                .map((f: any) => {
                    const { type = f.type } = normalizeType(f);
                    return { ...f, type, ...getComponentFor(type || f.type) };
                }),
        [optional, daywiseFields],
    );

    return (
        <ScrollableTable className="table-bordered" exportSheetName={exportSheetName}>
            <GroupHead additionalCols={additionalCols} boardId={boardId} costView={costView} />
            <GroupBody additionalCols={additionalCols} boardId={boardId} costView={costView} />
        </ScrollableTable>
    );
}
