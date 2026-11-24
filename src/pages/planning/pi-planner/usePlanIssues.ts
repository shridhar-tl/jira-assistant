import { useMemo } from 'react';

import type { PiData } from './pi-loader';
import { getPlanSprintRanges } from './pi-model';
import { getIssueLookup, getPlanScope, type IssueLookup, type PlanScope } from './pi-progress';
import { usePiStore } from './pi-store';
import type { PiDocument } from './pi-types';

export interface PlanIssues {
    issues: IssueLookup;
    sprintEnds: Map<number, Date>;
    scope: PlanScope;
}

/** Every issue known to the plan (stories, features and tracked issues), the end date of each sprint of its teams and the plan's scope. */
export default function usePlanIssues(doc: PiDocument, data: PiData): PlanIssues {
    const tracked = usePiStore((s) => s.trackedIssues);
    const issues = useMemo(() => getIssueLookup(data, tracked), [data, tracked]);
    const sprintEnds = useMemo(() => {
        const ends = new Map<number, Date>();
        getPlanSprintRanges(doc, data).forEach((range, sprintId) => ends.set(sprintId, range.end));
        return ends;
    }, [doc, data]);
    const scope = useMemo(() => getPlanScope(doc), [doc]);
    return { issues, sprintEnds, scope };
}
