import { toDateKey } from '../shared/segments';
import type { PlannerSprint } from '../shared/types';

import { createIterations, matchSprints } from './pi-model';
import type { PiIteration, PiTeam } from './pi-types';

export interface PiDefinitionState {
    teams: PiTeam[];
    start: Date;
    end: Date;
    iterations: PiIteration[];
    sprintLists: Record<number, PlannerSprint[]>;
    /** A new plan matches every team's sprints and its iterations to the dates; a saved plan only matches the teams added to it. */
    isNew: boolean;
    /** Teams of the saved plan, whose sprint selection is kept even when it is empty. */
    savedBoardIds: number[];
    ipSprint: boolean;
}

export type PiDefinitionAction =
    | { type: 'teams'; teams: PiTeam[] }
    | { type: 'dates'; start: Date; end: Date }
    | { type: 'sprintsLoaded'; lists: Record<number, PlannerSprint[]> }
    | { type: 'teamSprints'; boardId: number; sprintIds: number[] }
    | { type: 'iterations'; iterations: PiIteration[] }
    | { type: 'regenerate' };

function matchTeam(team: PiTeam, state: PiDefinitionState): PiTeam {
    return { ...team, sprintIds: matchSprints(state.sprintLists[team.boardId] || [], toDateKey(state.start), toDateKey(state.end)).map((s) => s.id) };
}

function regenerate(state: PiDefinitionState): PiDefinitionState {
    const teams = state.teams.map((t) => matchTeam(t, state));
    const iterations = createIterations(
        toDateKey(state.start),
        toDateKey(state.end),
        teams.map((t) => (state.sprintLists[t.boardId] || []).filter((s) => t.sprintIds.includes(s.id))),
        state.ipSprint,
    );
    return { ...state, teams, iterations };
}

function autoMatch(state: PiDefinitionState): PiDefinitionState {
    if (!state.teams.length || state.teams.some((t) => !state.sprintLists[t.boardId])) {
        return state;
    }
    if (state.isNew) {
        return regenerate(state);
    }
    return { ...state, teams: state.teams.map((t) => (t.sprintIds.length || state.savedBoardIds.includes(t.boardId) ? t : matchTeam(t, state))) };
}

export function piDefinitionReducer(state: PiDefinitionState, action: PiDefinitionAction): PiDefinitionState {
    switch (action.type) {
        case 'teams':
            return autoMatch({ ...state, teams: action.teams });
        case 'dates':
            return autoMatch({ ...state, start: action.start, end: action.end });
        case 'sprintsLoaded':
            return autoMatch({ ...state, sprintLists: { ...state.sprintLists, ...action.lists } });
        case 'teamSprints':
            return { ...state, teams: state.teams.map((t) => (t.boardId === action.boardId ? { ...t, sprintIds: action.sprintIds } : t)) };
        case 'iterations':
            return { ...state, iterations: action.iterations };
        case 'regenerate':
            return regenerate(state);
        default:
            return state;
    }
}
