import React, { useMemo } from 'react';
import { ScrollableTable } from '../../../components/ScrollableTable';
import { getComponentFor, normalizeType } from '../../../display-controls';
import { connect } from "../datastore";
import GroupHead from './GroupHead';
import GroupBody from './GroupBody';

const worklogAuthorField = { key: 'worklogUser', type: 'user', name: 'Worklog author' };
const logDateTime = { key: 'logDateTime', type: 'datetime', name: 'Worklog date' };

function GroupedDataGrid({ boardId, splitWorklogDays, fields, exportSheetName, costView }) {
    const { optional, daywiseFields } = fields || {};
    const additionalCols = useMemo(() => {
        const cols = [worklogAuthorField, ...optional?.filter(f => daywiseFields?.[f.id]) ?? []];

        if (splitWorklogDays) {
            cols.splice(0, 0, logDateTime);
        }

        return cols.map(f => {
            const { type = f.type } = normalizeType(f);
            return ({ ...f, type, ...getComponentFor(type || f.type) });
        });
    }, [optional, daywiseFields, splitWorklogDays]);

    return (
        <ScrollableTable className="table-bordered" exportSheetName={exportSheetName}>
            <GroupHead additionalCols={additionalCols} boardId={boardId} />
            <GroupBody additionalCols={additionalCols} boardId={boardId} costView={costView} />
        </ScrollableTable>
    );
}

export default connect(GroupedDataGrid, ({ splitWorklogDays, fields }) => ({ splitWorklogDays, fields }));
