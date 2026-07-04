export interface PokerIssue {
    id: string;
    key: string;
    url?: string;
    icon?: string;
    summary?: string;
    root?: string;
}

export interface PokerMember {
    id: string;
    name: string;
    email?: string;
    avatarUrl?: string;
    avatarId?: number | null;
    [key: `vote_${string}`]: boolean;
}

export interface PokerVote {
    id: string;
    reveal: boolean;
    average?: number;
    maxVote?: number;
    finalScore?: number | string;
    [userId: string]: any;
}

export interface PokerState {
    hasExtensionSupport: boolean;
    roomId: string;
    roomName?: string;
    sid: string;
    created: number;
    currentIssueId: string | null;
    viewingIssueId: string | null;
    lastActivity: number;
    timer: number;
    waitingRoom: boolean;
    moderatorId: string;
    members: PokerMember[];
    membersMap: Record<string, PokerMember>;
    issues: PokerIssue[];
    issuesMap: Record<string, PokerIssue>;
    votes: PokerVote[];
    votesMap: Record<string, PokerVote>;
    autoReveal: boolean;
    showHalfScore: boolean;
    maxPoints: number;
    scoreType: number;
    showConfigs: boolean;
    token?: string;
}

export type PokerActions = {
    setState: (partial: Partial<PokerState>) => void;
    reset: () => void;
};
