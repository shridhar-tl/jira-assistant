import React, { Fragment } from 'react';

import { THead } from '../../../components/shared';
import { useWorklogStore } from '../datastore';

import { DatesList, WeeksList } from './shared';

interface GroupHeadProps {
    additionalCols?: any[];
    boardId?: string;
    costView?: boolean;
}

export default function GroupHead({ additionalCols, boardId, costView }: GroupHeadProps) {
    const state = useWorklogStore();
    const { timeframeType } = state;

    const useSprint = timeframeType === '1';
    const sprintsList = useSprint ? state[`sprintsList_${boardId}`] : undefined;
    const addlColCount = (additionalCols?.length || 0) + 1;

    return (
        <THead>
            <tr className="data-center pad-min auto-wrap">
                <th style={{ minWidth: 260 + addlColCount * 120 }} rowSpan={addlColCount > 1 ? 1 : 2} colSpan={addlColCount}>
                    User Details
                </th>
                {useSprint &&
                    sprintsList?.map((s: any) => (
                        <Fragment key={s.id}>
                            <WeeksList sprint={s} />
                            <th rowSpan={2}>Sprint Total</th>
                        </Fragment>
                    ))}
                {!useSprint && <WeeksList />}
                {!costView && <th style={{ minWidth: 50, maxWidth: 100 }} rowSpan={2}>Total Hours</th>}
                {costView && <th style={{ minWidth: 50, maxWidth: 100 }} rowSpan={2}>Total Cost</th>}
            </tr>
            <tr className="pad-min auto-wrap">
                {addlColCount > 1 && <th style={{ minWidth: 380 }}>Issue details</th>}
                {additionalCols?.map((f) => (
                    <th key={f.key}>{f.name}</th>
                ))}
                {useSprint && sprintsList?.map(({ id }: any) => <DatesList key={id} sprintId={id} />)}
                {!useSprint && <DatesList />}
            </tr>
        </THead>
    );
}
