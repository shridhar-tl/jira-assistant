import React, { useMemo } from 'react';
import { ScrollableTable } from '../../../components/ScrollableTable';
import { getComponentFor } from '../../../display-controls';
import { connect } from "../datastore";
import GroupHead from './GroupHead';
import GroupBody from './GroupBody';

const worklogAuthorField = { key: 'worklogUser', type: 'user', name: 'Worklog author' };

function GroupedDataGrid({ boardId, fields, exportSheetName, costView }) {
    const { optional, daywiseFields } = fields || {};
    const additionalCols = useMemo(() => [worklogAuthorField, ...optional?.filter(f => daywiseFields?.[f.key])]
        .map(f => ({ ...f, ...getComponentFor(f.type) })),
        [optional, daywiseFields]);

    return (
        <ScrollableTable className="table-bordered" exportSheetName={exportSheetName}>
            <GroupHead additionalCols={additionalCols} boardId={boardId} />
            <GroupBody additionalCols={additionalCols} boardId={boardId} costView={costView} />
        </ScrollableTable>
    );
}

export default connect(GroupedDataGrid, ({ fields }) => ({ fields }));
