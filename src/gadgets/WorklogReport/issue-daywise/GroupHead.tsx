import React, { Fragment } from 'react';

import { THead } from '../../../components/shared';
import { useWorklogStore } from '../datastore';
import { DatesList, WeeksList } from '../userdaywise/shared';

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

    return (
        <THead>
            <tr className="data-center pad-min auto-wrap">
                <th style={{ minWidth: 380 }} rowSpan={2}>
                    Issue details
                </th>
                {additionalCols?.map((f) => (
                    <th key={f.key} rowSpan={2}>
                        {f.name}
                    </th>
                ))}
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
                {useSprint && sprintsList?.map(({ id }: any) => <DatesList key={id} sprintId={id} />)}
                {!useSprint && <DatesList />}
            </tr>
        </THead>
    );
}
