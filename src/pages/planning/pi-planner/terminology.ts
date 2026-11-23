import type { Terminology } from '../shared/types';

import type { RoamStatus } from './pi-types';

export interface TermSet {
    plan: string;
    plans: string;
    program: string;
    team: string;
    teams: string;
    iteration: string;
    ipIteration: string;
    objectives: string;
    objective: string;
    risks: string;
    risk: string;
    value: string;
    plannedValue: string;
    actualValue: string;
    committed: string;
    uncommitted: string;
    confidence: string;
    feature: string;
    features: string;
    roam: Record<RoamStatus, string>;
}

const neutral: TermSet = {
    plan: 'Quarter plan',
    plans: 'Quarter plans',
    program: 'Program',
    team: 'Team',
    teams: 'Teams',
    iteration: 'Iteration',
    ipIteration: 'Planning iteration',
    objectives: 'Objectives',
    objective: 'Objective',
    risks: 'Risks',
    risk: 'Risk',
    value: 'Value',
    plannedValue: 'Planned value',
    actualValue: 'Actual value',
    committed: 'Committed',
    uncommitted: 'Stretch',
    confidence: 'Confidence',
    feature: 'Feature',
    features: 'Features',
    roam: { open: 'Open', resolved: 'Resolved', owned: 'Owned', accepted: 'Accepted', mitigated: 'Mitigated' },
};

const safe: TermSet = {
    plan: 'PI',
    plans: 'Program Increments',
    program: 'ART',
    team: 'Team',
    teams: 'Teams',
    iteration: 'Iteration',
    ipIteration: 'IP iteration',
    objectives: 'PI Objectives',
    objective: 'PI Objective',
    risks: 'ROAM board',
    risk: 'Risk',
    value: 'Business value',
    plannedValue: 'Planned BV',
    actualValue: 'Actual BV',
    committed: 'Committed',
    uncommitted: 'Uncommitted',
    confidence: 'Confidence vote',
    feature: 'Feature',
    features: 'Features',
    roam: { open: 'Not ROAMed', resolved: 'Resolved', owned: 'Owned', accepted: 'Accepted', mitigated: 'Mitigated' },
};

export function getTerms(terminology: Terminology): TermSet {
    return terminology === 'safe' ? safe : neutral;
}
