import type { Terminology } from '../shared/types';

import type { RoamStatus } from './pi-types';

export interface TermSet {
    plan: string;
    plans: string;
    program: string;
    programs: string;
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
    programs: 'Programs',
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
    programs: 'ARTs',
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

/** A term in lower case for use inside a sentence, keeping acronyms such as PI, ART or BV in capitals. */
export function lowerTerm(term: string): string {
    return term
        .split(' ')
        .map((word) => (word.length > 1 && word === word.toUpperCase() && /[A-Z]/.test(word) ? word : word.toLowerCase()))
        .join(' ');
}

/** A term with its indefinite article, e.g. "an ART", "a PI", "a quarter plan". */
export function articleTerm(term: string): string {
    return `${/^[aeiou]/i.test(term) ? 'an' : 'a'} ${lowerTerm(term)}`;
}
