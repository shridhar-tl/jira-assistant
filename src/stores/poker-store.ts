import { create } from 'zustand';

import type { PokerState, PokerActions } from '@/pages/poker/types';

const initialState: PokerState = {
    hasExtensionSupport: false,
    roomId: '',
    sid: '',
    created: 0,
    currentIssueId: null,
    viewingIssueId: null,
    lastActivity: 0,
    timer: 0,
    waitingRoom: false,
    moderatorId: '',
    members: [],
    membersMap: {},
    issues: [],
    issuesMap: {},
    votes: [],
    votesMap: {},
    autoReveal: false,
    showHalfScore: true,
    maxPoints: 89,
    scoreType: 1,
    showConfigs: false,
};

export const usePokerStore = create<PokerState & PokerActions>((set) => ({
    ...initialState,
    setState: (partial) => set((state) => ({ ...state, ...partial })),
    reset: () => set(initialState),
}));
