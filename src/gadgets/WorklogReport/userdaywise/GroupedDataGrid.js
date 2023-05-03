import React, { useMemo } from 'react';
import { ScrollableTable } from '../../../components/ScrollableTable';
import { getComponentFor } from '../../../display-controls';
import { connect } from "../datastore";
import GroupBody from './GroupBody';
import GroupHead from './GroupHead';
import './Common.scss';

function GroupedDataGrid({ boardId, fields, exportSheetName, costView }) {
    const { optional, daywiseFields } = fields || {};
    const additionalCols = useMemo(() => optional?.filter(f => daywiseFields?.[f.key])
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
